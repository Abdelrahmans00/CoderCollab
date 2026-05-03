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

/**
 * ✅ FIX: Handle multiple Vercel domains properly
 */
const allowedOrigins = [
  "http://localhost:5173",
  "https://coder-collab-frontend-pykt.vercel.app",
  "https://coder-collab-frontend-pykt-1fhd4r7vb-abdelrahmans00s-projects.vercel.app",
];

/**
 * Shared CORS checker (used for both Express + Socket.IO)
 */
const corsOptions = {
  origin: (origin: any, callback: any) => {
    // allow server-to-server or tools like Postman
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

/**
 * Express CORS
 */
app.use(cors(corsOptions));

/**
 * Socket.IO CORS
 */
const io = new Server(httpServer, {
  cors: corsOptions,
  pingInterval: 25000,
  pingTimeout: 60000,
});

/**
 * Socket setup
 */
setupRoomSocket(io);

/**
 * Middleware
 */
app.use(express.json());

/**
 * Health check
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * Routes
 */
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);

/**
 * Global error handler
 */
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Server Error:", err.message || err);
  res.status(500).json({ error: "Internal server error" });
});

/**
 * Start server
 */
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});

export { io, httpServer };