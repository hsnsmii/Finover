"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRateLimiter = exports.globalRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
const errors_1 = require("../types/errors");
const rateLimitHandler = (req, _res, next) => {
    next(new errors_1.TooManyRequestsError('Too many requests, please slow down', {
        ip: req.ip
    }));
};
exports.globalRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.RATE_LIMIT_WINDOW_MS,
    max: env_1.env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    skip: () => env_1.env.isTest
});
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: env_1.env.AUTH_RATE_LIMIT_WINDOW_MS,
    max: env_1.env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
    keyGenerator: (req) => req.ip ?? 'unknown',
    skip: () => env_1.env.isTest
});
//# sourceMappingURL=rateLimit.middleware.js.map