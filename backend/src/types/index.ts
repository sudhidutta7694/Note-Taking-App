import { Request } from 'express';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name?: string;
    verified?: boolean;
    [key: string]: any;
  };
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  dateOfBirth?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface OTPData {
  email: string;
  otp: string;
}

export interface NoteData {
  title: string;
  content: string;
}
