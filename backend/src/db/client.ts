import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const prisma = new PrismaClient({
  log: env.isDevelopment ? ['query', 'info', 'warn', 'error'] : ['error', 'warn']
});

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL');
  } catch (error) {
    logger.error('Failed to connect to PostgreSQL', { error });
    throw error;
  }
};

export const disconnectDatabase = async () => {
  await prisma.$disconnect();
};
