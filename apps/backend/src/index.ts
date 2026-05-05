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


const allowedOrigins = [
  "http://localhost:5173",
  "https://coder-collab-frontend-pykt.vercel.app",
  "https://coder-collab-frontend-pykt-1fhd4r7vb-abdelrahmans00s-projects.vercel.app",
];


const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
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
});


setupRoomSocket(io);


app.use(express.json());


app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});


app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);


app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Server Error:", err.message || err);
  res.status(500).json({ error: "Internal server error" });
});


const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(` Backend running on port ${PORT}`);
});

export { io, httpServer };