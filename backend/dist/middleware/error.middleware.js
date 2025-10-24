"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const uuid_1 = require("uuid");
const env_1 = require("../config/env");
const sentry_1 = require("../config/sentry");
const logger_1 = require("../config/logger");
const errors_1 = require("../types/errors");
const errorHandler = (err, req, res, _next) => {
    const errorId = (0, uuid_1.v4)();
    const isAppError = err instanceof errors_1.AppError;
    const statusCode = isAppError ? err.statusCode : 500;
    const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
    const message = statusCode >= 500 && env_1.env.isProduction
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
    logger_1.logger.error('Request failed', {
        ...logPayload,
        error: err instanceof Error ? { message: err.message, stack: err.stack } : err
    });
    if (err instanceof Error && (0, sentry_1.isSentryEnabled)()) {
        (0, sentry_1.captureWithSentry)(err, req, res, logPayload);
    }
    res.status(statusCode).json({
        errorId,
        code,
        message
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=error.middleware.js.map