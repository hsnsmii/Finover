import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import ms from 'ms';
import { z } from 'zod';

const envFilePath = path.resolve(process.cwd(), '.env');
loadEnv({ path: envFilePath });

const allowedLogLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'] as const;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_ISS: z.string().min(1, 'JWT_ISS is required'),
  JWT_AUD: z.string().min(1, 'JWT_AUD is required'),
  ACCESS_TTL: z.string().default('15m'),
  REFRESH_TTL: z.string().default('7d'),
  SENTRY_DSN: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional(),
  SENTRY_RELEASE: z.string().optional(),
  LOG_LEVEL: z.enum(allowedLogLevels).default('info'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN is required'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().default(10),
  REQUEST_BODY_LIMIT: z.string().default('1mb'),
  PASSWORD_HASH_MEMORY_COST: z.coerce.number().default(65536),
  PASSWORD_HASH_TIME_COST: z.coerce.number().default(3),
  PASSWORD_HASH_PARALLELISM: z.coerce.number().default(1),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
  LOGIN_DELAY_MS: z.coerce.number().default(200),
  CLOCK_TOLERANCE_SECONDS: z.coerce.number().default(5),
  TRUST_PROXY: z.string().default('1')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formatted = parsed.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
  throw new Error(`Invalid environment configuration: ${formatted}`);
}

const raw = parsed.data;

export const env = {
  ...raw,
  ACCESS_TTL_MS: ms(raw.ACCESS_TTL),
  REFRESH_TTL_MS: ms(raw.REFRESH_TTL),
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test'
};

if (typeof env.ACCESS_TTL_MS !== 'number' || typeof env.REFRESH_TTL_MS !== 'number') {
  throw new Error('Failed to parse ACCESS_TTL or REFRESH_TTL to milliseconds.');
}
