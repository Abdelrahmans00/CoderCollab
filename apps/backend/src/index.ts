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

const FRONTEND_URL =
  process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL
    : "http://localhost:5173";

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 60000,
});

setupRoomSocket(io);

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

app.use((err: any, _req: express.Request, res: express.Response) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Backend running → ${PORT}`);
});

export { io, httpServer };