import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET!;

if (!SECRET) {
  throw new Error('JWT_SECRET is not set in .env');
}

export const generateToken = (userId: string): string =>
  jwt.sign({ userId }, SECRET, { expiresIn: '7d' });

export const verifyToken = (token: string): { userId: string } =>
  jwt.verify(token, SECRET) as { userId: string };