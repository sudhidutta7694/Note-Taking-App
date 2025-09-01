import { Request, Response, NextFunction } from 'express';

export const debugHeaders = (req: Request, res: Response, next: NextFunction) => {
  console.log('🔍 Request Headers Debug:');
  console.log('Authorization:', req.headers.authorization);
  console.log('All headers:', JSON.stringify(req.headers, null, 2));
  next();
};
