import jwt, { type SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? '7d') as unknown as
  | number
  | `${number}${'s' | 'm' | 'h' | 'd' | 'y'}`; // StringValue for v9 types

export const generateToken = (userId: string, email: string): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN, // accepts number or duration-like string e.g. '7d'
  };
  return jwt.sign({ id: userId, email: email }, JWT_SECRET, options);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET);
};
