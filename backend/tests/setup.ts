import { execSync } from 'node:child_process';
import path from 'node:path';
import { prisma } from '../src/db/client';

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

const projectRoot = path.resolve(__dirname, '..');
const prismaSchemaPath = path.resolve(projectRoot, 'prisma', 'schema.prisma');

beforeAll(async () => {
  execSync(`npx prisma migrate deploy --schema "${prismaSchemaPath}"`, {
    cwd: projectRoot,
    stdio: 'inherit'
  });
});

beforeEach(async () => {
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
