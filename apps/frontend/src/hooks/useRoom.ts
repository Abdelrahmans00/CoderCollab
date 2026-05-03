import { useEffect, useCallback, useRef, MutableRefObject } from "react";
import { getSocket } from "../services/socket";
import {
  useRoomStore,
} from "../store/roomStore";

import type { RoomUser, ChatMessage, CursorPosition, Problem } from "../store/roomStore";

const USER_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#06B6D4", "#F97316", "#EC4899",
];

export const useRoom = (
  roomId: string,
  userId: string,
  userName: string,
  role: "interviewer" | "candidate" = "candidate",
  // Direct ref to Monaco's applyCode — bypasses React state for zero-flicker updates
  applyCodeRef?: MutableRefObject<((code: string) => void) | null>
) => {
  const {
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
  } = useRoomStore();

  const socket = getSocket();
  const colorRef = useRef(
    USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
  );

  // ── Apply code to editor + store ─────────────────────────────
  // Used for both room-state (restore) and code-update (live sync)
  const applyCode = useCallback(
    (code: string) => {
      // Write to Monaco directly — no re-render, no flicker
      applyCodeRef?.current?.(code);
      // Keep store in sync for other components that read it
      setCode(code);
    },
    [applyCodeRef, setCode]
  );

  useEffect(() => {
    socket.emit("join-room", {
      roomId,
      userId,
      userName,
      color: colorRef.current,
      role,
    });

    // ── Room state (initial restore) ─────────────────────────
    socket.on(
      "room-state",
      (data: { code: string; language: string; problem: Problem | null }) => {
        // Apply code directly to Monaco — this is the restore path
        applyCode(data.code);
        setLanguage(data.language);
        if (data.problem) setProblem(data.problem);
      }
    );

    // ── User events ──────────────────────────────────────────
    socket.on("users-update", (users: RoomUser[]) => setUsers(users));
    socket.on("user-joined", (user: RoomUser) => addUser(user));
    socket.on("user-left", ({ userId: leftId }: { userId: string }) => {
      removeUser(leftId);
      removeCursor(leftId);
    });

    // ── Code sync (remote user typed) ───────────────────────
    socket.on("code-update", ({ code }: { code: string }) => {
      // Apply directly to Monaco — bypasses React state entirely
      applyCode(code);
    });

    // ── Language ─────────────────────────────────────────────
    socket.on("language-update", ({ language }: { language: string }) => {
      setLanguage(language);
    });

    // ── Cursors ──────────────────────────────────────────────
    socket.on("cursor-update", (cursor: CursorPosition) => {
      updateCursor(cursor);
    });

    // ── Chat (includes system messages) ─────────────────────
    socket.on("new-message", (msg: ChatMessage) => {
      addMessage(msg);
    });

    // ── Timer ────────────────────────────────────────────────
    socket.on(
      "timer-started",
      ({ endsAt, duration }: { endsAt: number; duration: number }) => {
        startTimer(endsAt, duration);
      }
    );
    socket.on("timer-stopped", () => stopTimer());

    // ── Interview events ─────────────────────────────────────
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
      socket.off("room-state");
      socket.off("users-update");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("code-update");
      socket.off("language-update");
      socket.off("cursor-update");
      socket.off("new-message");
      socket.off("timer-started");
      socket.off("timer-stopped");
      socket.off("role-updated");
      socket.off("problem-updated");
      resetRoom();
    };
  }, [roomId, userId, userName, role]);

  // ── Emitters ─────────────────────────────────────────────────
  const emitCodeChange = useCallback(
    (code: string) => socket.emit("code-change", { roomId, code }),
    [roomId]
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
    [roomId, userId, userName]
  );

  const emitLanguageChange = useCallback(
    (language: string) => {
      socket.emit("language-change", { roomId, language });
      const { code } = useRoomStore.getState();
      socket.emit("code-change", { roomId, code });
    },
    [roomId]
  );

  const sendMessage = useCallback(
    (message: string) =>
      socket.emit("send-message", { roomId, message, userId, userName }),
    [roomId, userId, userName]
  );

  const startTimerEmit = useCallback(
    (duration: number) =>
      socket.emit("start-timer", { roomId, duration }),
    [roomId]
  );

  const stopTimerEmit = useCallback(
    () => socket.emit("stop-timer", { roomId }),
    [roomId]
  );

  const setProblemEmit = useCallback(
    (problem: Problem) =>
      socket.emit("set-problem", { roomId, problem }),
    [roomId]
  );

  const resetProblemEmit = useCallback(
    () => socket.emit("reset-problem", { roomId }),
    [roomId]
  );

  const setRoleEmit = useCallback(
    (targetUserId: string, newRole: "interviewer" | "candidate") =>
      socket.emit("set-role", { roomId, targetUserId, role: newRole }),
    [roomId]
  );

  return {
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