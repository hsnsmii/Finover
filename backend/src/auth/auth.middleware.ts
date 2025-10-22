import type { NextFunction, Request, Response } from 'express';
import { AuthError } from '../types/errors';
import { verifyAccessToken } from './token.service';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next(new AuthError('Authorization header missing'));
  }

  const token = header.replace('Bearer ', '').trim();

  if (!token) {
    return next(new AuthError('Access token missing'));
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = payload;
    res.locals.userId = payload.sub;

    return next();
  } catch (error) {
    return next(new AuthError('Invalid or expired access token'));
  }
};
