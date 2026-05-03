import { create } from "zustand";

export interface RoomUser {
  userId: string;
  userName: string;
  color: string;
  socketId?: string;
  role?: "interviewer" | "candidate";
}

export interface ChatMessage {
  id: string;
  message: string;
  userId: string;
  userName: string;
  timestamp: string;
  isSystem?: boolean;  
}

export interface CursorPosition {
  userId: string;
  userName: string;
  color: string;
  position: { line: number; column: number };
}

export interface Problem {
  title: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
}

interface RoomState {
  roomId: string | null;
  code: string;
  language: string;
  users: RoomUser[];
  messages: ChatMessage[];
  cursors: Record<string, CursorPosition>;

  // Interview mode
  isInterviewer: boolean;
  problem: Problem | null;
  timerActive: boolean;
  timerEndsAt: number | null;
  timerDuration: number;

  // Actions
  setRoomId: (id: string) => void;
  setCode: (code: string) => void;
  setLanguage: (lang: string) => void;
  setUsers: (users: RoomUser[]) => void;
  addUser: (user: RoomUser) => void;
  removeUser: (userId: string) => void;
  addMessage: (msg: ChatMessage) => void;
  updateCursor: (cursor: CursorPosition) => void;
  removeCursor: (userId: string) => void;
  setInterviewer: (val: boolean) => void;
  setProblem: (problem: Problem | null) => void;
  startTimer: (endsAt: number, duration: number) => void;
  stopTimer: () => void;
  resetRoom: () => void;
}

const initialState = {
  roomId: null,
  code: "// Start coding here\n",
  language: "javascript",
  users: [],
  messages: [],
  cursors: {},
  isInterviewer: false,
  problem: null,
  timerActive: false,
  timerEndsAt: null,
  timerDuration: 30,
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initialState,

  setRoomId: (roomId) => set({ roomId }),
  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setUsers: (users) => set({ users }),

  addUser: (user) =>
    set((s) => ({
      users: s.users.some((u) => u.userId === user.userId)
        ? s.users
        : [...s.users, user],
    })),

  removeUser: (userId) =>
    set((s) => ({
      users: s.users.filter((u) => u.userId !== userId),
      cursors: Object.fromEntries(
        Object.entries(s.cursors).filter(([id]) => id !== userId)
      ),
    })),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  updateCursor: (cursor) =>
    set((s) => ({ cursors: { ...s.cursors, [cursor.userId]: cursor } })),

  removeCursor: (userId) =>
    set((s) => {
      const { [userId]: _, ...rest } = s.cursors;
      return { cursors: rest };
    }),

  setInterviewer: (isInterviewer) => set({ isInterviewer }),
  setProblem: (problem) => set({ problem }),

  startTimer: (timerEndsAt, timerDuration) =>
    set({ timerActive: true, timerEndsAt, timerDuration }),

  stopTimer: () =>
    set({ timerActive: false, timerEndsAt: null }),

  resetRoom: () => set(initialState),
}));