import type { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { TooManyRequestsError } from '../types/errors';

const rateLimitHandler = (req: Request, _res: Response, next: (err?: unknown) => void) => {
  next(
    new TooManyRequestsError('Too many requests, please slow down', {
      ip: req.ip
    })
  );
};

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => env.isTest
});

export const authRateLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req: Request) => req.ip ?? 'unknown',
  skip: () => env.isTest
});
