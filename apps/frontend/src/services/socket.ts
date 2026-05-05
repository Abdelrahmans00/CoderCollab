import { io, Socket } from "socket.io-client";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const normalizeSocketUrl = (apiUrl: string): string => {
  const trimmed = apiUrl.trim().replace(/\/+$/, "");

  try {
    const parsed = new URL(trimmed);
    parsed.pathname = parsed.pathname.replace(/\/api$/i, "");
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return trimmed.replace(/\/api$/i, "");
  }
};

const SOCKET_URL = normalizeSocketUrl(API_URL);

const isProduction = import.meta.env.PROD;

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      // Production on some hosts/proxies is more stable with websocket-only.
      transports: isProduction ? ["websocket"] : ["polling", "websocket"],
      path: "/socket.io",
    });

    socket.on("connect", () => {
      console.log("Socket connected:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};