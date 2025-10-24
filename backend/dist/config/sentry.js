"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSentryEnabled = exports.captureWithSentry = exports.getSentryErrorHandler = exports.initSentry = void 0;
const Sentry = __importStar(require("@sentry/node"));
const env_1 = require("./env");
const logger_1 = require("./logger");
let sentryEnabled = false;
const initSentry = (app) => {
    if (!env_1.env.SENTRY_DSN) {
        logger_1.logger.warn('Sentry DSN not provided, skipping Sentry initialization');
        return;
    }
    Sentry.init({
        dsn: env_1.env.SENTRY_DSN,
        environment: env_1.env.SENTRY_ENVIRONMENT ?? env_1.env.NODE_ENV,
        release: env_1.env.SENTRY_RELEASE,
        tracesSampleRate: env_1.env.isProduction ? 0.1 : 1.0
    });
    sentryEnabled = true;
    app.use(Sentry.Handlers.requestHandler());
    app.use(Sentry.Handlers.tracingHandler());
};
exports.initSentry = initSentry;
const getSentryErrorHandler = () => {
    if (!sentryEnabled) {
        return (err, _req, _res, next) => next(err);
    }
    return Sentry.Handlers.errorHandler();
};
exports.getSentryErrorHandler = getSentryErrorHandler;
const captureWithSentry = (err, request, response, context = {}) => {
    if (!sentryEnabled) {
        return;
    }
    Sentry.withScope((scope) => {
        if (request) {
            scope.addEventProcessor((event) => Sentry.Handlers.parseRequest(event, request));
        }
        if (response?.locals?.requestId) {
            scope.setTag('requestId', response.locals.requestId);
        }
        Object.entries(context).forEach(([key, value]) => {
            scope.setExtra(key, value);
        });
        if (response?.locals?.userId) {
            scope.setUser({ id: response.locals.userId });
        }
        Sentry.captureException(err);
    });
};
exports.captureWithSentry = captureWithSentry;
const isSentryEnabled = () => sentryEnabled;
exports.isSentryEnabled = isSentryEnabled;
//# sourceMappingURL=sentry.js.map