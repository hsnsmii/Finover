import { createLogger, format, transports } from 'winston';
import type { TransformableInfo } from 'logform';
import { env } from './env';

const { combine, timestamp, errors, json, metadata } = format;

const SENSITIVE_KEYS = new Set(['password', 'token', 'accesstoken', 'refreshtoken', 'authorization', 'secret']);

const maskSensitive = (value: unknown, depth = 0, maxDepth = 4): unknown => {
  if (depth > maxDepth) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => maskSensitive(item, depth + 1, maxDepth));
  }

  if (value && typeof value === 'object') {
    const masked: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        masked[key] = '[REDACTED]';
      } else {
        masked[key] = maskSensitive(val, depth + 1, maxDepth);
      }
    }
    return masked;
  }

  return value;
};

const sanitizeLog = format((info: TransformableInfo) => {
  if (info.message && typeof info.message === 'object') {
    info.message = maskSensitive(info.message);
  }

  if (info.metadata) {
    info.metadata = maskSensitive(info.metadata);
  }

  if (info.error && typeof info.error === 'object') {
    info.error = maskSensitive(info.error);
  }

  return info;
});

export const logger = createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: {
    service: 'finov-backend',
    environment: env.NODE_ENV
  },
  format: combine(
    timestamp(),
    errors({ stack: true }),
    metadata({ fillExcept: ['message', 'level', 'timestamp'] }),
    sanitizeLog(),
    json()
  ),
  transports: [
    new transports.Console({
      handleExceptions: true
    })
  ],
  exitOnError: false
});

export const logWithContext = (meta: Record<string, unknown>) => logger.child(meta);

export const maskFields = maskSensitive;
