import type { NextFunction, Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { env } from '../config/env';
import { captureWithSentry, isSentryEnabled } from '../config/sentry';
import { logger } from '../config/logger';
import { AppError } from '../types/errors';

export interface ErrorResponseBody {
  errorId: string;
  code: string;
  message: string;
}

export const errorHandler = (err: unknown, req: Request, res: Response<ErrorResponseBody>, _next: NextFunction) => {
  const errorId = uuid();
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message =
    statusCode >= 500 && env.isProduction
      ? 'Internal server error'
      : err instanceof Error
        ? err.message
        : 'Unexpected error';

  const logPayload = {
    errorId,
    code,
    statusCode,
    requestId: res.locals.requestId,
    userId: res.locals.userId ?? null
  };

  logger.error('Request failed', {
    ...logPayload,
    error: err instanceof Error ? { message: err.message, stack: err.stack } : err
  });

  if (err instanceof Error && isSentryEnabled()) {
    captureWithSentry(err, req, res, logPayload);
  }

  res.status(statusCode).json({
    errorId,
    code,
    message
  });
};
