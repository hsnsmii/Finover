"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskFields = exports.logWithContext = exports.logger = void 0;
const winston_1 = require("winston");
const env_1 = require("./env");
const { combine, timestamp, errors, json, metadata } = winston_1.format;
const SENSITIVE_KEYS = new Set(['password', 'token', 'accesstoken', 'refreshtoken', 'authorization', 'secret']);
const maskSensitive = (value, depth = 0, maxDepth = 4) => {
    if (depth > maxDepth) {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => maskSensitive(item, depth + 1, maxDepth));
    }
    if (value && typeof value === 'object') {
        const masked = {};
        for (const [key, val] of Object.entries(value)) {
            if (SENSITIVE_KEYS.has(key.toLowerCase())) {
                masked[key] = '[REDACTED]';
            }
            else {
                masked[key] = maskSensitive(val, depth + 1, maxDepth);
            }
        }
        return masked;
    }
    return value;
};
const sanitizeLog = (0, winston_1.format)((info) => {
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
exports.logger = (0, winston_1.createLogger)({
    level: env_1.env.LOG_LEVEL,
    defaultMeta: {
        service: 'finov-backend',
        environment: env_1.env.NODE_ENV
    },
    format: combine(timestamp(), errors({ stack: true }), metadata({ fillExcept: ['message', 'level', 'timestamp'] }), sanitizeLog(), json()),
    transports: [
        new winston_1.transports.Console({
            handleExceptions: true
        })
    ],
    exitOnError: false
});
const logWithContext = (meta) => exports.logger.child(meta);
exports.logWithContext = logWithContext;
exports.maskFields = maskSensitive;
//# sourceMappingURL=logger.js.map