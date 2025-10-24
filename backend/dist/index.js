"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const logger_1 = require("./config/logger");
const client_1 = require("./db/client");
let server = null;
const start = async () => {
    try {
        await (0, client_1.connectDatabase)();
        server = app_1.default.listen(env_1.env.PORT, () => {
            logger_1.logger.info(`Server listening on port ${env_1.env.PORT}`);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server', { error });
        process.exit(1);
    }
};
const shutdown = async (signal) => {
    logger_1.logger.info(`Received ${signal}, shutting down gracefully`);
    if (server) {
        await new Promise((resolve) => {
            server?.close(() => resolve());
        });
    }
    await (0, client_1.disconnectDatabase)();
    process.exit(0);
};
void start();
process.on('SIGINT', () => {
    void shutdown('SIGINT');
});
process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
});
process.on('uncaughtException', (error) => {
    logger_1.logger.error('Uncaught exception', { error });
    process.exit(1);
});
process.on('unhandledRejection', (reason) => {
    logger_1.logger.error('Unhandled rejection', { reason });
});
//# sourceMappingURL=index.js.map