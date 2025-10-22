import type { NextFunction, Request, Response } from 'express';
import onFinished from 'on-finished';
import { logger, maskFields } from '../config/logger';

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();

  onFinished(res, () => {
    const durationNs = Number(process.hrtime.bigint() - start);
    const durationMs = Math.round((durationNs / 1_000_000 + Number.EPSILON) * 100) / 100;

    logger.info('HTTP request completed', {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      requestId: res.locals.requestId,
      userId: res.locals.userId ?? null,
      ip: req.ip,
      contentLength: res.getHeader('content-length'),
      userAgent: req.headers['user-agent'],
      body: req.method !== 'GET' ? maskFields(req.body) : undefined
    });
  });

  next();
};
