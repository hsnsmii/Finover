"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.httpLogger = void 0;
const on_finished_1 = __importDefault(require("on-finished"));
const logger_1 = require("../config/logger");
const httpLogger = (req, res, next) => {
    const start = process.hrtime.bigint();
    (0, on_finished_1.default)(res, () => {
        const durationNs = Number(process.hrtime.bigint() - start);
        const durationMs = Math.round((durationNs / 1000000 + Number.EPSILON) * 100) / 100;
        logger_1.logger.info('HTTP request completed', {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs,
            requestId: res.locals.requestId,
            userId: res.locals.userId ?? null,
            ip: req.ip,
            contentLength: res.getHeader('content-length'),
            userAgent: req.headers['user-agent'],
            body: req.method !== 'GET' ? (0, logger_1.maskFields)(req.body) : undefined
        });
    });
    next();
};
exports.httpLogger = httpLogger;
//# sourceMappingURL=httpLogger.middleware.js.map