import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./modules/auth/auth.routes";
import roomRoutes from "./modules/room/room.routes";
import { setupRoomSocket } from "./sockets/room.socket";
import executeRoutes from "./modules/execute/execute.routes";

const app = express();
const httpServer = createServer(app);


const staticAllowedOrigins = [
  "http://localhost:5173",
  "https://coder-collab-frontend-pykt.vercel.app",
  "https://coder-collab-frontend-pykt-1fhd4r7vb-abdelrahmans00s-projects.vercel.app",
];

const envAllowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...staticAllowedOrigins, ...envAllowedOrigins]);

const isAllowedOrigin = (origin: string): boolean => {
  if (allowedOrigins.has(origin)) return true;

  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) return true;
  if (/^http:\/\/localhost:\d+$/i.test(origin)) return true;

  return false;
};


const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (!origin) return callback(null, true);

    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));


const io = new Server(httpServer, {
  cors: corsOptions,
  pingInterval: 25000,
  pingTimeout: 60000,
  transports: process.env.NODE_ENV === "production" ? ["websocket"] : ["websocket", "polling"],
  allowUpgrades: process.env.NODE_ENV !== "production",
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true,
  },
});

io.engine.on("connection_error", (err) => {
  console.error("Socket.IO engine connection error:", {
    code: err.code,
    message: err.message,
    context: err.context,
  });
});


setupRoomSocket(io);


app.use(express.json());


app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});


app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/execute", executeRoutes);


app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Server Error:", err.message || err);
  res.status(500).json({ error: "Internal server error" });
});


const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(` Backend running on port ${PORT}`);
});

export { io, httpServer };