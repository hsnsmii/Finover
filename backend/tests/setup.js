"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_child_process_1 = require("node:child_process");
const node_path_1 = __importDefault(require("node:path"));
const client_1 = require("../src/db/client");
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.PORT ?? '0';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/finover_test';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
process.env.JWT_ISS = process.env.JWT_ISS ?? 'finover-test';
process.env.JWT_AUD = process.env.JWT_AUD ?? 'finover-mobile-test';
process.env.ACCESS_TTL = process.env.ACCESS_TTL ?? '5m';
process.env.REFRESH_TTL = process.env.REFRESH_TTL ?? '7d';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? '*';
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? 'error';
process.env.SENTRY_DSN = '';
const projectRoot = node_path_1.default.resolve(__dirname, '..');
const prismaSchemaPath = node_path_1.default.resolve(projectRoot, 'prisma', 'schema.prisma');
beforeAll(async () => {
    (0, node_child_process_1.execSync)(`npx prisma migrate deploy --schema "${prismaSchemaPath}"`, {
        cwd: projectRoot,
        stdio: 'inherit'
    });
});
beforeEach(async () => {
    await client_1.prisma.refreshToken.deleteMany();
    await client_1.prisma.user.deleteMany();
});
afterAll(async () => {
    await client_1.prisma.$disconnect();
});
//# sourceMappingURL=setup.js.map