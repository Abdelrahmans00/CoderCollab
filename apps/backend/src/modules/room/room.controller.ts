import { Response } from "express";
import { AuthRequest } from "../../middleware/authenticate";
import { createRoom, getRooms, getRoomById } from "./room.service";

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type } = req.body;

    if (!name) {
      res.status(400).json({ error: "Room name is required" });
      return;
    }
    if (type !== "session" && type !== "interview") {
      res.status(400).json({ error: 'type must be "session" or "interview"' });
      return;
    }

    const room = await createRoom(name, type);
    res.status(201).json(room);
  } catch {
    res.status(500).json({ error: "Could not create room" });
  }
};

export const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const type = req.query.type as string;

    if (type !== "session" && type !== "interview") {
      res.status(400).json({ error: 'Query param type must be "session" or "interview"' });
      return;
    }

    const rooms = await getRooms(type);
    res.json(rooms);
  } catch {
    res.status(500).json({ error: "Could not fetch rooms" });
  }
};

export const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const idParam = req.params.id;

    const id = Array.isArray(idParam) ? idParam[0] : idParam;

    const room = await getRoomById(id);

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    res.json(room);
  } catch {
    res.status(500).json({ error: "Server error" });
  }
};