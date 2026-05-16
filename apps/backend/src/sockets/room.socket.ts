import { Server, Socket } from "socket.io";
import Redis from "ioredis";
import * as Y from "yjs";
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

const formatError = (err: unknown): string => {
  if (err instanceof Error) {
    return err.message || err.name || "Unknown Error";
  }

  if (typeof err === "string") return err;

  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
};

class SafeRedisStore implements RedisLike {
  private readonly memory = new InMemoryRedisLike();
  private redis: Redis | null;
  private usingFallback = false;

  constructor(redis: Redis | null) {
    this.redis = redis;
  }

  private activateFallback(reason: string): void {
    if (this.usingFallback) return;
    this.usingFallback = true;
    console.warn(`Redis unavailable (${reason}). Falling back to in-memory cache.`);

    if (this.redis) {
      try {
        this.redis.disconnect();
      } catch {
      }
      this.redis = null;
    }
  }

  private async run<T>(
    operation: string,
    primary: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    if (this.usingFallback || !this.redis) {
      return fallback();
    }

    try {
      return await primary();
    } catch (err) {
      this.activateFallback(`${operation} failed: ${formatError(err)}`);
      return fallback();
    }
  }

  async get(key: string): Promise<string | null> {
    return this.run("GET", () => this.redis!.get(key), () => this.memory.get(key));
  }

  async set(key: string, value: string): Promise<"OK"> {
    return this.run("SET", () => this.redis!.set(key, value), () => this.memory.set(key, value));
  }

  async del(key: string): Promise<number> {
    return this.run("DEL", () => this.redis!.del(key), () => this.memory.del(key));
  }

  async smembers(key: string): Promise<string[]> {
    return this.run("SMEMBERS", () => this.redis!.smembers(key), () => this.memory.smembers(key));
  }

  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.run(
      "SADD",
      () => this.redis!.sadd(key, ...members),
      () => this.memory.sadd(key, ...members)
    );
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
    const redisClient = new Redis(rawUrl, {
      maxRetriesPerRequest: 1,
      enableReadyCheck: false,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 10_000,
      retryStrategy: (times) => Math.min(times * 1000, 5000),
    });

    redisClient.on("error", (err) => {
      console.error(`Redis error: ${formatError(err)}`);
    });
    redisClient.on("connect", () => console.log("Redis connected"));
    redisClient.on("reconnecting", (delay: number) => {
      console.warn(`Redis reconnecting in ${delay}ms`);
    });
    redisClient.on("end", () => {
      console.warn("Redis connection ended");
    });

    return new SafeRedisStore(redisClient);
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

interface RoomCrdtState {
  doc: Y.Doc;
  text: Y.Text;
}

interface BinaryEnvelope {
  data?: number[];
}

type BinaryPayload = number[] | Uint8Array | ArrayBuffer | BinaryEnvelope;

const roomCodeKey = (roomId: string) => `room:${roomId}:code`;
const roomLanguageKey = (roomId: string) => `room:${roomId}:language`;
const roomProblemKey = (roomId: string) => `room:${roomId}:problem`;
const roomUsersKey = (roomId: string) => `room:${roomId}:users`;
const roomYjsKey = (roomId: string) => `room:${roomId}:yjs`;

const YJS_REMOTE_ORIGIN = "socket-remote";

const toUint8Array = (payload: BinaryPayload): Uint8Array => {
  if (payload instanceof Uint8Array) return payload;
  if (payload instanceof ArrayBuffer) return new Uint8Array(payload);
  if (Array.isArray(payload)) return Uint8Array.from(payload);
  if (payload && Array.isArray(payload.data)) {
    return Uint8Array.from(payload.data);
  }
  return new Uint8Array();
};

const encodeUpdateToBase64 = (update: Uint8Array): string =>
  Buffer.from(update).toString("base64");

const decodeUpdateFromBase64 = (encoded: string): Uint8Array =>
  Uint8Array.from(Buffer.from(encoded, "base64"));

const createRoomCrdtState = (initialCode: string): RoomCrdtState => {
  const doc = new Y.Doc();
  const text = doc.getText("code");
  if (initialCode) {
    text.insert(0, initialCode);
  }
  return { doc, text };
};

// Track per-room autosave intervals.
const roomIntervals = new Map<string, ReturnType<typeof setInterval>>();

// Keep active Yjs docs in memory while a room has users.
const roomCrdtStates = new Map<string, RoomCrdtState>();

// Helpers
const getRoomUsers = async (roomId: string): Promise<UserMeta[]> => {
  const raw = await redis.smembers(roomUsersKey(roomId));
  return raw.map((r) => JSON.parse(r));
};

const saveRoomUsers = async (roomId: string, users: UserMeta[]) => {
  const key = roomUsersKey(roomId);
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

const persistRoomCrdtState = async (
  roomId: string,
  state: RoomCrdtState
): Promise<void> => {
  const snapshot = Y.encodeStateAsUpdate(state.doc);
  await redis.set(roomYjsKey(roomId), encodeUpdateToBase64(snapshot));
  await redis.set(roomCodeKey(roomId), state.text.toString());
};

const loadOrCreateRoomCrdtState = async (
  roomId: string,
  fallbackCode: string
): Promise<RoomCrdtState> => {
  const cached = roomCrdtStates.get(roomId);
  if (cached) return cached;

  const encoded = await redis.get(roomYjsKey(roomId));

  let state: RoomCrdtState;

  if (encoded) {
    state = createRoomCrdtState("");

    try {
      const update = decodeUpdateFromBase64(encoded);
      Y.applyUpdate(state.doc, update, "redis-init");
    } catch (err) {
      console.warn(`[yjs] failed to decode stored state for room ${roomId}`, err);
      state = createRoomCrdtState(fallbackCode);
      await persistRoomCrdtState(roomId, state);
    }
  } else {
    state = createRoomCrdtState(fallbackCode);
    await persistRoomCrdtState(roomId, state);
  }

  roomCrdtStates.set(roomId, state);
  return state;
};

const releaseRoomCrdtState = (roomId: string): void => {
  const state = roomCrdtStates.get(roomId);
  if (!state) return;
  state.doc.destroy();
  roomCrdtStates.delete(roomId);
};

// Persist code from Redis to PostgreSQL
const persistRoomCode = async (roomId: string): Promise<void> => {
  const code = await redis.get(roomCodeKey(roomId));
  const language = await redis.get(roomLanguageKey(roomId));
  if (code === null) return;
  try {
    await saveRoomCode(roomId, code, language ?? "javascript");
    console.log(`[autosave] room ${roomId} saved to DB`);
  } catch (err) {
    console.error(`[autosave] failed for room ${roomId}:`, err);
  }
};

// Start a 60s autosave interval for a room
const startAutosave = (roomId: string): void => {
  if (roomIntervals.has(roomId)) return;
  const interval = setInterval(() => persistRoomCode(roomId), 60_000);
  roomIntervals.set(roomId, interval);
  console.log(`[autosave] started for room ${roomId}`);
};

// Stop autosave when room is empty
const stopAutosave = (roomId: string): void => {
  const interval = roomIntervals.get(roomId);
  if (!interval) return;
  clearInterval(interval);
  roomIntervals.delete(roomId);
  console.log(`[autosave] stopped for room ${roomId}`);
};

// Broadcast a system message to the room
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

const handleRoomExit = async (
  io: Server,
  socket: Socket,
  roomId: string,
  source: "leave-room" | "disconnecting"
): Promise<void> => {
  if (!roomId || roomId === socket.id) return;

  await persistRoomCode(roomId);

  const leaving = await removeUserFromRoom(roomId, socket.id);

  if (socket.rooms.has(roomId)) {
    await socket.leave(roomId);
  }

  if (!leaving) return;

  const remaining = await getRoomUsers(roomId);

  io.to(roomId).emit("users-update", remaining);
  socket.to(roomId).emit("user-left", {
    userId: leaving.userId,
    userName: leaving.userName,
  });

  systemMessage(io, roomId, `${leaving.userName} left the room`);

  if (remaining.length === 0) {
    stopAutosave(roomId);
    releaseRoomCrdtState(roomId);
    console.log(`Room ${roomId} is now empty`);
  }

  console.log(`${leaving.userName} left room ${roomId} (${source})`);
};

// Main socket setup
export const setupRoomSocket = (io: Server) => {
  io.on("connection", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join room
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
        try {
          socket.join(roomId);

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

          // Restore code/language from Redis -> DB -> defaults.
          let currentCode = await redis.get(roomCodeKey(roomId));
          let currentLanguage = await redis.get(roomLanguageKey(roomId));

          if (currentCode === null) {
            const saved = await getRoomCode(roomId);
            if (saved) {
              currentCode = saved.code;
              currentLanguage = saved.language;
              await redis.set(roomCodeKey(roomId), currentCode);
              await redis.set(roomLanguageKey(roomId), currentLanguage ?? "javascript");
              console.log(`[restore] room ${roomId} restored from DB`);
            } else {
              currentCode = "// Start coding here\n";
              currentLanguage = "javascript";
            }
          }

          const crdtState = await loadOrCreateRoomCrdtState(roomId, currentCode ?? "");
          const crdtCode = crdtState.text.toString();

          if (currentCode !== crdtCode) {
            currentCode = crdtCode;
            await redis.set(roomCodeKey(roomId), currentCode);
          }

          const cachedProblem = await redis.get(roomProblemKey(roomId));

          socket.emit("room-state", {
            code: currentCode,
            language: currentLanguage ?? "javascript",
            problem: cachedProblem ? JSON.parse(cachedProblem) : null,
          });

          socket.emit("yjs-init", {
            update: Array.from(Y.encodeStateAsUpdate(crdtState.doc)),
          });

          io.to(roomId).emit("users-update", updated);

          socket.to(roomId).emit("user-joined", {
            userId,
            userName,
            color,
            role,
          });

          if (withoutStale.length > 0) {
            systemMessage(io, roomId, `${userName} joined the room`);
          }

          startAutosave(roomId);

          console.log(`${userName} joined room ${roomId}`);
        } catch (err) {
          console.error(`[socket:join-room] room ${roomId} failed:`, err);
        }
      }
    );

    // CRDT update (primary sync path)
    socket.on(
      "yjs-update",
      async ({ roomId, update }: { roomId: string; update: BinaryPayload }) => {
        try {
          const incoming = toUint8Array(update);
          if (incoming.length === 0) return;

          const currentCode = (await redis.get(roomCodeKey(roomId))) ?? "";
          const state = await loadOrCreateRoomCrdtState(roomId, currentCode);

          Y.applyUpdate(state.doc, incoming, YJS_REMOTE_ORIGIN);

          await persistRoomCrdtState(roomId, state);

          socket.to(roomId).emit("yjs-update", { update: Array.from(incoming) });
        } catch (err) {
          console.error(`[socket:yjs-update] room ${roomId} failed:`, err);
        }
      }
    );

    // Legacy full-text sync support (converts text replacement into a Yjs transaction)
    socket.on(
      "code-change",
      async ({ roomId, code }: { roomId: string; code: string }) => {
        try {
          const state = await loadOrCreateRoomCrdtState(roomId, "");

          state.doc.transact(() => {
            if (state.text.length > 0) {
              state.text.delete(0, state.text.length);
            }
            if (code) {
              state.text.insert(0, code);
            }
          }, "legacy-code-change");

          await persistRoomCrdtState(roomId, state);

          socket.to(roomId).emit("yjs-update", {
            update: Array.from(Y.encodeStateAsUpdate(state.doc)),
          });
        } catch (err) {
          console.error(`[socket:code-change] room ${roomId} failed:`, err);
        }
      }
    );

    // Language change
    socket.on(
      "language-change",
      async ({ roomId, language }: { roomId: string; language: string }) => {
        try {
          await redis.set(roomLanguageKey(roomId), language);
          socket.to(roomId).emit("language-update", { language });
        } catch (err) {
          console.error(`[socket:language-change] room ${roomId} failed:`, err);
        }
      }
    );

    // Cursor
    socket.on("cursor-move", (payload: any) => {
      const { roomId, ...cursorData } = payload;
      socket.to(roomId).emit("cursor-update", cursorData);
    });

    // Chat
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

    // Timer
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

    // Role assignment
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

    // Problem
    socket.on(
      "set-problem",
      ({ roomId, problem }: { roomId: string; problem: any }) => {
        redis.set(roomProblemKey(roomId), JSON.stringify(problem));
        io.to(roomId).emit("problem-updated", { problem });
      }
    );

    socket.on("reset-problem", ({ roomId }: { roomId: string }) => {
      redis.del(roomProblemKey(roomId));
      io.to(roomId).emit("problem-updated", { problem: null });
    });

    socket.on("leave-room", async ({ roomId }: { roomId: string }) => {
      await handleRoomExit(io, socket, roomId, "leave-room");
    });

    // Disconnect
    socket.on("disconnecting", async () => {
      const joinedRooms = [...socket.rooms].filter(
        (roomId) => roomId !== socket.id
      );

      for (const roomId of joinedRooms) {
        await handleRoomExit(io, socket, roomId, "disconnecting");
      }
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
