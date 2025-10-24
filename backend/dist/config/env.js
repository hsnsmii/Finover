"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const node_fs_1 = require("node:fs");
const node_path_1 = __importDefault(require("node:path"));
const dotenv_1 = require("dotenv");
const ms_1 = __importDefault(require("ms"));
const zod_1 = require("zod");
const candidateEnvPaths = [
    node_path_1.default.resolve(__dirname, '../../../.env'),
    node_path_1.default.resolve(process.cwd(), '..', '.env'),
    node_path_1.default.resolve(process.cwd(), '.env'),
    node_path_1.default.resolve(__dirname, '../../.env')
];
const envFilePath = candidateEnvPaths.find((filePath) => (0, node_fs_1.existsSync)(filePath));
if (envFilePath) {
    (0, dotenv_1.config)({ path: envFilePath });
}
else {
    (0, dotenv_1.config)();
}
const allowedLogLevels = ['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'];
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.coerce.number().int().positive().default(8080),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    JWT_ACCESS_SECRET: zod_1.z.string().min(1, 'JWT_ACCESS_SECRET is required'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(1, 'JWT_REFRESH_SECRET is required'),
    JWT_ISS: zod_1.z.string().min(1, 'JWT_ISS is required'),
    JWT_AUD: zod_1.z.string().min(1, 'JWT_AUD is required'),
    ACCESS_TTL: zod_1.z.string().default('15m'),
    REFRESH_TTL: zod_1.z.string().default('7d'),
    SENTRY_DSN: zod_1.z.string().optional(),
    SENTRY_ENVIRONMENT: zod_1.z.string().optional(),
    SENTRY_RELEASE: zod_1.z.string().optional(),
    LOG_LEVEL: zod_1.z.enum(allowedLogLevels).default('info'),
    CORS_ORIGIN: zod_1.z.string().min(1, 'CORS_ORIGIN is required'),
    RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(60000),
    RATE_LIMIT_MAX: zod_1.z.coerce.number().default(100),
    AUTH_RATE_LIMIT_WINDOW_MS: zod_1.z.coerce.number().default(60000),
    AUTH_RATE_LIMIT_MAX: zod_1.z.coerce.number().default(10),
    REQUEST_BODY_LIMIT: zod_1.z.string().default('1mb'),
    PASSWORD_HASH_MEMORY_COST: zod_1.z.coerce.number().default(65536),
    PASSWORD_HASH_TIME_COST: zod_1.z.coerce.number().default(3),
    PASSWORD_HASH_PARALLELISM: zod_1.z.coerce.number().default(1),
    BCRYPT_ROUNDS: zod_1.z.coerce.number().default(12),
    LOGIN_DELAY_MS: zod_1.z.coerce.number().default(200),
    CLOCK_TOLERANCE_SECONDS: zod_1.z.coerce.number().default(5),
    TRUST_PROXY: zod_1.z.string().default('1')
});
const parseDurationToMs = (value, label) => {
    const result = (0, ms_1.default)(value);
    if (typeof result !== 'number') {
        throw new Error(`${label} must be a valid duration string`);
    }
    return result;
};
const envSource = {
    ...process.env
};
if (!envSource.ACCESS_TTL && envSource.ACCESS_TOKEN_EXPIRES) {
    envSource.ACCESS_TTL = envSource.ACCESS_TOKEN_EXPIRES;
}
if (!envSource.REFRESH_TTL && envSource.REFRESH_TOKEN_EXPIRES) {
    envSource.REFRESH_TTL = envSource.REFRESH_TOKEN_EXPIRES;
}
const parsed = envSchema.safeParse(envSource);
if (!parsed.success) {
    const formatted = parsed.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
    throw new Error(`Invalid environment configuration: ${formatted}`);
}
const raw = parsed.data;
exports.env = {
    ...raw,
    ACCESS_TTL_MS: parseDurationToMs(raw.ACCESS_TTL, 'ACCESS_TTL'),
    REFRESH_TTL_MS: parseDurationToMs(raw.REFRESH_TTL, 'REFRESH_TTL'),
    isProduction: raw.NODE_ENV === 'production',
    isDevelopment: raw.NODE_ENV === 'development',
    isTest: raw.NODE_ENV === 'test'
};
if (typeof exports.env.ACCESS_TTL_MS !== 'number' || typeof exports.env.REFRESH_TTL_MS !== 'number') {
    throw new Error('Failed to parse ACCESS_TTL or REFRESH_TTL to milliseconds.');
}
//# sourceMappingURL=env.js.map