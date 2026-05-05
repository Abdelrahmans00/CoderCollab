import { io, Socket } from "socket.io-client";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const SOCKET_URL = API_URL.endsWith("/api")
  ? API_URL.slice(0, -4)
  : API_URL.replace("/api/", "/");

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      // Start with polling, upgrade to websocket — more reliable on Railway
      transports: ["polling", "websocket"],
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