import { Server, Socket } from "socket.io";
import Redis from "ioredis";
import { saveRoomCode, getRoomCode } from "../modules/room/room.service";

type RedisLike = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<"OK">;
  del(key: string): Promise<number>;
  smembers(key: string): Promise<string[]>;
  sadd(key: string, ...members: string[]): Promise<number>;
};

class InMemoryRedisLike implements RedisLike {
  private values = new Map<string, string>();
  private sets = new Map<string, Set<string>>();

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<"OK"> {
    this.values.set(key, value);
    return "OK";
  }

  async del(key: string): Promise<number> {
    const existed = this.values.delete(key) || this.sets.delete(key);
    return existed ? 1 : 0;
  }

  async smembers(key: string): Promise<string[]> {
    return Array.from(this.sets.get(key) ?? []);
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    const set = this.sets.get(key) ?? new Set<string>();
    let added = 0;
    for (const member of members) {
      if (!set.has(member)) {
        set.add(member);
        added += 1;
      }
    }
    this.sets.set(key, set);
    return added;
  }
}

const isValidRedisUrl = (value: string): boolean => {
  if (!value) return false;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "redis:" || parsed.protocol === "rediss:";
  } catch {
    return false;
  }
};

const createRedisStore = (): RedisLike => {
  const rawUrl = (process.env.REDIS_URL || "").trim();

  if (!isValidRedisUrl(rawUrl)) {
    console.warn(
      "Redis disabled, missing, or invalid. Using in-memory room cache."
    );
    return new InMemoryRedisLike();
  }

  try {
    const redis = new Redis(rawUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 10_000,
      retryStrategy: (times) => Math.min(times * 1000, 5000),
    });

    redis.on("error", (err) => console.error("Redis error:", err.message));
    redis.on("connect", () => console.log("Redis connected"));

    return redis as unknown as RedisLike;
  } catch (err) {
    console.warn("Failed to create Redis client, using in-memory room cache.", err);
    return new InMemoryRedisLike();
  }
};

const redis = createRedisStore();

interface UserMeta {
  userId: string;
  userName: string;
  color: string;
  socketId: string;
  role: string;
}

// ── Track per-room autosave intervals ─────────────────────────
// Key: roomId → NodeJS.Timeout
const roomIntervals = new Map<string, ReturnType<typeof setInterval>>();

// ── Helpers ────────────────────────────────────────────────────
const getRoomUsers = async (roomId: string): Promise<UserMeta[]> => {
  const raw = await redis.smembers(`room:${roomId}:users`);
  return raw.map((r) => JSON.parse(r));
};

const saveRoomUsers = async (roomId: string, users: UserMeta[]) => {
  const key = `room:${roomId}:users`;
  await redis.del(key);
  if (users.length > 0) {
    await redis.sadd(key, ...users.map((u) => JSON.stringify(u)));
  }
};

const removeUserFromRoom = async (
  roomId: string,
  socketId: string
): Promise<UserMeta | null> => {
  const users = await getRoomUsers(roomId);
  const leaving = users.find((u) => u.socketId === socketId);
  if (!leaving) return null;
  const remaining = users.filter((u) => u.socketId !== socketId);
  await saveRoomUsers(roomId, remaining);
  return leaving;
};

// ── Persist code from Redis → PostgreSQL ──────────────────────
const persistRoomCode = async (roomId: string): Promise<void> => {
  const code = await redis.get(`room:${roomId}:code`);
  const language = await redis.get(`room:${roomId}:language`);
  if (code === null) return; // nothing to save yet
  try {
    await saveRoomCode(roomId, code, language ?? "javascript");
    console.log(`[autosave] room ${roomId} saved to DB`);
  } catch (err) {
    console.error(`[autosave] failed for room ${roomId}:`, err);
  }
};

// ── Start a 60s autosave interval for a room ─────────────────
const startAutosave = (roomId: string): void => {
  if (roomIntervals.has(roomId)) return; // already running
  const interval = setInterval(() => persistRoomCode(roomId), 60_000);
  roomIntervals.set(roomId, interval);
  console.log(`[autosave] started for room ${roomId}`);
};

// ── Stop autosave when room is empty ─────────────────────────
const stopAutosave = (roomId: string): void => {
  const interval = roomIntervals.get(roomId);
  if (!interval) return;
  clearInterval(interval);
  roomIntervals.delete(roomId);
  console.log(`[autosave] stopped for room ${roomId}`);
};

// ── Broadcast a system message to the room ───────────────────
const systemMessage = (
  io: Server,
  roomId: string,
  text: string
): void => {
  io.to(roomId).emit("new-message", {
    id: `sys-${Date.now()}`,
    message: text,
    userId: "system",
    userName: "System",
    timestamp: new Date().toISOString(),
    isSystem: true,
  });
};

// ── Main socket setup ─────────────────────────────────────────
export const setupRoomSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ── Join room ────────────────────────────────────────────
    socket.on(
      "join-room",
      async ({
        roomId,
        userId,
        userName,
        color,
        role = "candidate",
      }: {
        roomId: string;
        userId: string;
        userName: string;
        color: string;
        role?: string;
      }) => {
        socket.join(roomId);

        // Remove stale entry for this userId (refresh / reconnect)
        const existing = await getRoomUsers(roomId);
        const withoutStale = existing.filter((u) => u.userId !== userId);

        const newUser: UserMeta = {
          userId,
          userName,
          color,
          socketId: socket.id,
          role,
        };
        const updated = [...withoutStale, newUser];
        await saveRoomUsers(roomId, updated);

        // ── Restore code ─────────────────────────────────────
        // Priority: Redis (live) → PostgreSQL (last saved) → default
        let currentCode = await redis.get(`room:${roomId}:code`);
        let currentLanguage = await redis.get(`room:${roomId}:language`);

        if (currentCode === null) {
          // Redis is cold — restore from DB
          const saved = await getRoomCode(roomId);
          if (saved) {
            currentCode = saved.code;
            currentLanguage = saved.language;
            // Warm Redis back up so other operations work
            await redis.set(`room:${roomId}:code`, currentCode);
            await redis.set(
              `room:${roomId}:language`,
              currentLanguage ?? "javascript"
            );
            console.log(`[restore] room ${roomId} restored from DB`);
          } else {
            currentCode = "// Start coding here\n";
            currentLanguage = "javascript";
          }
        }

        const cachedProblem = await redis.get(`room:${roomId}:problem`);

        socket.emit("room-state", {
          code: currentCode,
          language: currentLanguage ?? "javascript",
          problem: cachedProblem ? JSON.parse(cachedProblem) : null,
        });

        // Send full user list to everyone
        io.to(roomId).emit("users-update", updated);

        // Notify others (not the joining user)
        socket.to(roomId).emit("user-joined", {
          userId,
          userName,
          color,
          role,
        });

        // System message visible to everyone already in the room
        if (withoutStale.length > 0) {
          // Only announce if room wasn't empty before
          systemMessage(io, roomId, `${userName} joined the room`);
        }

        // Start autosave for this room
        startAutosave(roomId);

        console.log(`${userName} joined room ${roomId}`);
      }
    );

    // ── Code change ──────────────────────────────────────────
    socket.on(
      "code-change",
      async ({ roomId, code }: { roomId: string; code: string }) => {
        await redis.set(`room:${roomId}:code`, code);
        socket.to(roomId).emit("code-update", { code });
      }
    );

    // ── Language change ──────────────────────────────────────
    socket.on(
      "language-change",
      async ({ roomId, language }: { roomId: string; language: string }) => {
        await redis.set(`room:${roomId}:language`, language);
        socket.to(roomId).emit("language-update", { language });
      }
    );

    // ── Cursor ───────────────────────────────────────────────
    socket.on("cursor-move", (payload: any) => {
      const { roomId, ...cursorData } = payload;
      socket.to(roomId).emit("cursor-update", cursorData);
    });

    // ── Chat ─────────────────────────────────────────────────
    socket.on(
      "send-message",
      ({
        roomId,
        message,
        userId,
        userName,
      }: {
        roomId: string;
        message: string;
        userId: string;
        userName: string;
      }) => {
        io.to(roomId).emit("new-message", {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          message,
          userId,
          userName,
          timestamp: new Date().toISOString(),
          isSystem: false,
        });
      }
    );

    // ── Timer ────────────────────────────────────────────────
    socket.on(
      "start-timer",
      ({ roomId, duration }: { roomId: string; duration: number }) => {
        io.to(roomId).emit("timer-started", {
          duration,
          startTime: Date.now(),
          endsAt: Date.now() + duration * 1000,
        });
      }
    );

    socket.on("stop-timer", ({ roomId }: { roomId: string }) => {
      io.to(roomId).emit("timer-stopped");
    });

    // ── Role assignment ──────────────────────────────────────
    socket.on(
      "set-role",
      ({
        roomId,
        targetUserId,
        role,
      }: {
        roomId: string;
        targetUserId: string;
        role: string;
      }) => {
        io.to(roomId).emit("role-updated", { userId: targetUserId, role });
      }
    );

    // ── Problem ──────────────────────────────────────────────
    socket.on(
      "set-problem",
      ({ roomId, problem }: { roomId: string; problem: any }) => {
        redis.set(`room:${roomId}:problem`, JSON.stringify(problem));
        io.to(roomId).emit("problem-updated", { problem });
      }
    );

    socket.on("reset-problem", ({ roomId }: { roomId: string }) => {
      redis.del(`room:${roomId}:problem`);
      io.to(roomId).emit("problem-updated", { problem: null });
    });

    // ── Disconnect ───────────────────────────────────────────
    socket.on("disconnecting", async () => {
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue;

        // 1. Save code to DB immediately before user is removed
        await persistRoomCode(roomId);

        // 2. Remove user from Redis
        const leaving = await removeUserFromRoom(roomId, socket.id);
        if (!leaving) continue;

        // 3. Get remaining users
        const remaining = await getRoomUsers(roomId);

        // 4. Broadcast updated user list
        io.to(roomId).emit("users-update", remaining);
        socket.to(roomId).emit("user-left", {
          userId: leaving.userId,
          userName: leaving.userName,
        });

        // 5. Send system message so everyone sees who left
        systemMessage(
          io,
          roomId,
          `${leaving.userName} left the room`
        );

        // 6. If room is now empty, stop autosave interval
        if (remaining.length === 0) {
          stopAutosave(roomId);
          console.log(`Room ${roomId} is now empty`);
        }

        console.log(`${leaving.userName} left room ${roomId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};