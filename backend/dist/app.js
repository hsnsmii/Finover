"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const sentry_1 = require("./config/sentry");
const auth_routes_1 = require("./auth/auth.routes");
const auth_middleware_1 = require("./auth/auth.middleware");
const auth_controller_1 = require("./auth/auth.controller");
const error_middleware_1 = require("./middleware/error.middleware");
const httpLogger_middleware_1 = require("./middleware/httpLogger.middleware");
const rateLimit_middleware_1 = require("./middleware/rateLimit.middleware");
const requestId_middleware_1 = require("./middleware/requestId.middleware");
const watchlists_routes_1 = require("./routes/watchlists.routes");
const stocks_routes_1 = require("./routes/stocks.routes");
const app = (0, express_1.default)();
(0, sentry_1.initSentry)(app);
const trustProxyValue = env_1.env.TRUST_PROXY.toLowerCase();
if (trustProxyValue === 'false') {
    app.set('trust proxy', false);
}
else if (trustProxyValue === 'true') {
    app.set('trust proxy', true);
}
else {
    const numeric = Number(trustProxyValue);
    app.set('trust proxy', Number.isNaN(numeric) ? env_1.env.TRUST_PROXY : numeric);
}
app.disable('x-powered-by');
app.use(requestId_middleware_1.requestIdMiddleware);
app.use(rateLimit_middleware_1.globalRateLimiter);
const allowedOrigins = env_1.env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
const allowAllOrigins = allowedOrigins.includes('*');
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (allowAllOrigins || !origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
}));
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: env_1.env.REQUEST_BODY_LIMIT }));
app.use(express_1.default.urlencoded({ extended: true, limit: env_1.env.REQUEST_BODY_LIMIT }));
app.use(httpLogger_middleware_1.httpLogger);
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
app.use('/auth', auth_routes_1.authRouter);
app.use('/api/watchlists', watchlists_routes_1.watchlistsRouter);
app.use('/api/stocks', stocks_routes_1.stocksRouter);
app.get('/me', auth_middleware_1.requireAuth, auth_controller_1.meHandler);
app.use((0, sentry_1.getSentryErrorHandler)());
app.use(error_middleware_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map