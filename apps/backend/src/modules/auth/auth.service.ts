import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt';
import { prisma } from '../../prisma/client';

export interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

export const registerUser = async (
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('Email already in use');

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
    select: { id: true, name: true, email: true },
  });

  return { token: generateToken(user.id), user };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid email or password');

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Invalid email or password');

  return {
    token: generateToken(user.id),
    user: { id: user.id, name: user.name, email: user.email },
  };
};

export const getMe = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, createdAt: true },
  });
};