"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = exports.prisma = void 0;
const client_1 = require("@prisma/client");
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
exports.prisma = new client_1.PrismaClient({
    log: env_1.env.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error', 'warn']
});
const connectDatabase = async () => {
    try {
        await exports.prisma.$connect();
        logger_1.logger.info('Connected to PostgreSQL');
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to PostgreSQL', { error });
        throw error;
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    await exports.prisma.$disconnect();
};
exports.disconnectDatabase = disconnectDatabase;
//# sourceMappingURL=client.js.map