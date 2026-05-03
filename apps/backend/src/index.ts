import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./modules/auth/auth.routes";
import roomRoutes from "./modules/room/room.routes";
import { setupRoomSocket } from "./sockets/room.socket";

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.NODE_ENV === "production"
        ? "https://yourdomain.com"
        : ["http://localhost:5173",
           "http://127.0.0.1:5500",
        ],
    credentials: true,
  },
  // Ping every 25s, disconnect if no pong within 60s
  pingInterval: 25000,
  pingTimeout: 60000,
});

setupRoomSocket(io);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? "https://yourdomain.com"
        : "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Backend running  → http://localhost:${PORT}`);
  console.log(`Socket.IO ready  → ws://localhost:${PORT}`);
});

export { io, httpServer };