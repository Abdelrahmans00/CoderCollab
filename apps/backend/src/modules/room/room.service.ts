import { prisma } from "../../prisma/client";

export type RoomType = "session" | "interview";

export const createRoom = async (name: string, type: RoomType) => {
  return prisma.room.create({ data: { name, type } });
};

export const getRooms = async (type: RoomType) => {
  return prisma.room.findMany({
    where: { type },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
};

export const getRoomById = async (id: string) => {
  return prisma.room.findUnique({ where: { id } });
};

export const saveRoomCode = async (
  roomId: string,
  code: string,
  language: string
) => {
  return prisma.room.update({
    where: { id: roomId },
    data: { code, language },
  });
};

export const getRoomCode = async (roomId: string) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { code: true, language: true },
  });
  return room;
};