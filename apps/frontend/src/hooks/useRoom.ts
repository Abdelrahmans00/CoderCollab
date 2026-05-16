import { useEffect, useCallback, useRef } from "react";
import * as Y from "yjs";

import { getSocket } from "../services/socket";
import { useRoomStore } from "../store/roomStore";

import type {
  RoomUser,
  ChatMessage,
  CursorPosition,
  Problem,
} from "../store/roomStore";

const USER_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#06B6D4", "#F97316", "#EC4899",
];

const YJS_REMOTE_ORIGIN = "socket-remote";

interface BinaryEnvelope {
  data?: number[];
}

type BinaryPayload = number[] | Uint8Array | ArrayBuffer | BinaryEnvelope;

const toUint8Array = (payload: BinaryPayload): Uint8Array => {
  if (payload instanceof Uint8Array) return payload;
  if (payload instanceof ArrayBuffer) return new Uint8Array(payload);
  if (Array.isArray(payload)) return Uint8Array.from(payload);
  if (payload && Array.isArray(payload.data)) {
    return Uint8Array.from(payload.data);
  }
  return new Uint8Array();
};

export const useRoom = (
  roomId: string,
  userId: string,
  userName: string,
  role: "interviewer" | "candidate" = "candidate"
) => {
  const setCode = useRoomStore((s) => s.setCode);
  const setLanguage = useRoomStore((s) => s.setLanguage);
  const setUsers = useRoomStore((s) => s.setUsers);
  const addUser = useRoomStore((s) => s.addUser);
  const removeUser = useRoomStore((s) => s.removeUser);
  const addMessage = useRoomStore((s) => s.addMessage);
  const updateCursor = useRoomStore((s) => s.updateCursor);
  const removeCursor = useRoomStore((s) => s.removeCursor);
  const startTimer = useRoomStore((s) => s.startTimer);
  const stopTimer = useRoomStore((s) => s.stopTimer);
  const setProblem = useRoomStore((s) => s.setProblem);
  const resetRoom = useRoomStore((s) => s.resetRoom);

  const socket = getSocket();
  const colorRef = useRef(
    USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
  );
  const joinedSocketIdRef = useRef<string | null>(null);

  const yDocRef = useRef<Y.Doc | null>(null);
  const yTextRef = useRef<Y.Text | null>(null);

  if (!yDocRef.current || !yTextRef.current) {
    const doc = new Y.Doc();
    yDocRef.current = doc;
    yTextRef.current = doc.getText("code");
  }

  const yDoc = yDocRef.current;
  const yText = yTextRef.current;

  const replaceCode = useCallback(
    (nextCode: string) => {
      yDoc.transact(() => {
        if (yText.length > 0) {
          yText.delete(0, yText.length);
        }
        if (nextCode) {
          yText.insert(0, nextCode);
        }
      }, "replace-code");
    },
    [yDoc, yText]
  );

  useEffect(() => {
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
    let receivedYjsInit = false;
    let fallbackCode = "";

    resetRoom();

    const joinRoom = () => {
      const currentSocketId = socket.id ?? null;
      if (currentSocketId && joinedSocketIdRef.current === currentSocketId) {
        return;
      }

      socket.emit("join-room", {
        roomId,
        userId,
        userName,
        color: colorRef.current,
        role,
      });

      joinedSocketIdRef.current = currentSocketId;
    };

    const scheduleFallback = () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }

      fallbackTimer = setTimeout(() => {
        if (receivedYjsInit) return;
        if (!fallbackCode || yText.length > 0) return;

        yDoc.transact(() => {
          yText.insert(0, fallbackCode);
        }, YJS_REMOTE_ORIGIN);
      }, 500);
    };

    const onRoomState = (data: {
      code: string;
      language: string;
      problem: Problem | null;
    }) => {
      fallbackCode = data.code ?? "";
      setCode(fallbackCode);
      setLanguage(data.language);
      if (data.problem) setProblem(data.problem);
      scheduleFallback();
    };

    const onYjsInit = ({ update }: { update: BinaryPayload }) => {
      receivedYjsInit = true;
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }

      const parsedUpdate = toUint8Array(update);
      if (parsedUpdate.length > 0) {
        Y.applyUpdate(yDoc, parsedUpdate, YJS_REMOTE_ORIGIN);
      }
      setCode(yText.toString());
    };

    const onYjsUpdate = ({ update }: { update: BinaryPayload }) => {
      const parsedUpdate = toUint8Array(update);
      if (parsedUpdate.length === 0) return;
      Y.applyUpdate(yDoc, parsedUpdate, YJS_REMOTE_ORIGIN);
    };

    const onDocUpdate = (update: Uint8Array, origin: unknown) => {
      setCode(yText.toString());
      if (origin === YJS_REMOTE_ORIGIN) return;
      socket.emit("yjs-update", { roomId, update: Array.from(update) });
    };

    yDoc.on("update", onDocUpdate);

    socket.on("connect", joinRoom);

    if (socket.connected) {
      joinRoom();
    }

    socket.on("room-state", onRoomState);
    socket.on("yjs-init", onYjsInit);
    socket.on("yjs-update", onYjsUpdate);

    socket.on("users-update", (users: RoomUser[]) => setUsers(users));
    socket.on("user-joined", (user: RoomUser) => addUser(user));
    socket.on("user-left", ({ userId: leftId }: { userId: string }) => {
      removeUser(leftId);
      removeCursor(leftId);
    });

    socket.on("language-update", ({ language }: { language: string }) => {
      setLanguage(language);
    });

    socket.on("cursor-update", (cursor: CursorPosition) => {
      updateCursor(cursor);
    });

    socket.on("new-message", (msg: ChatMessage) => {
      addMessage(msg);
    });

    socket.on(
      "timer-started",
      ({ endsAt, duration }: { endsAt: number; duration: number }) => {
        startTimer(endsAt, duration);
      }
    );
    socket.on("timer-stopped", () => stopTimer());

    socket.on(
      "role-updated",
      ({ userId: uid, role: newRole }: { userId: string; role: string }) => {
        useRoomStore.setState((s) => ({
          users: s.users.map((u) =>
            u.userId === uid
              ? { ...u, role: newRole as "interviewer" | "candidate" }
              : u
          ),
        }));
      }
    );

    socket.on("problem-updated", ({ problem }: { problem: Problem | null }) => {
      setProblem(problem);
    });

    return () => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }

      joinedSocketIdRef.current = null;

      yDoc.off("update", onDocUpdate);

      socket.off("connect", joinRoom);
      socket.off("room-state", onRoomState);
      socket.off("yjs-init", onYjsInit);
      socket.off("yjs-update", onYjsUpdate);
      socket.off("users-update");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("language-update");
      socket.off("cursor-update");
      socket.off("new-message");
      socket.off("timer-started");
      socket.off("timer-stopped");
      socket.off("role-updated");
      socket.off("problem-updated");

    };
  }, [
    roomId,
    userId,
    userName,
    role,
    socket,
    setCode,
    setLanguage,
    setUsers,
    addUser,
    removeUser,
    addMessage,
    updateCursor,
    removeCursor,
    startTimer,
    stopTimer,
    setProblem,
    resetRoom,
  ]);

  useEffect(() => {
    return () => {
      yDocRef.current?.destroy();
      yDocRef.current = null;
      yTextRef.current = null;
    };
  }, []);

  const emitCodeChange = useCallback(
    (code: string) => replaceCode(code),
    [replaceCode]
  );

  const emitCursorMove = useCallback(
    (line: number, column: number) =>
      socket.emit("cursor-move", {
        roomId,
        userId,
        userName,
        color: colorRef.current,
        position: { line, column },
      }),
    [roomId, userId, userName, socket]
  );

  const emitLanguageChange = useCallback(
    (language: string, nextCode?: string) => {
      socket.emit("language-change", { roomId, language });
      if (typeof nextCode === "string") {
        replaceCode(nextCode);
      }
    },
    [roomId, replaceCode, socket]
  );

  const sendMessage = useCallback(
    (message: string) =>
      socket.emit("send-message", { roomId, message, userId, userName }),
    [roomId, userId, userName, socket]
  );

  const startTimerEmit = useCallback(
    (duration: number) => socket.emit("start-timer", { roomId, duration }),
    [roomId, socket]
  );

  const stopTimerEmit = useCallback(
    () => socket.emit("stop-timer", { roomId }),
    [roomId, socket]
  );

  const setProblemEmit = useCallback(
    (problem: Problem) => socket.emit("set-problem", { roomId, problem }),
    [roomId, socket]
  );

  const resetProblemEmit = useCallback(
    () => socket.emit("reset-problem", { roomId }),
    [roomId, socket]
  );

  const setRoleEmit = useCallback(
    (targetUserId: string, newRole: "interviewer" | "candidate") =>
      socket.emit("set-role", { roomId, targetUserId, role: newRole }),
    [roomId, socket]
  );

  return {
    yText,
    emitCodeChange,
    emitCursorMove,
    emitLanguageChange,
    sendMessage,
    startTimerEmit,
    stopTimerEmit,
    setProblemEmit,
    resetProblemEmit,
    setRoleEmit,
    userColor: colorRef.current,
  };
};
