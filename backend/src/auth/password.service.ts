import argon2 from 'argon2';
import bcrypt from 'bcryptjs';
import { env } from '../config/env';
import { logger } from '../config/logger';

export type HashAlgorithm = 'argon2id' | 'bcrypt';

export interface HashMetadata {
  algorithm: HashAlgorithm;
  params: Record<string, unknown>;
}

export interface HashResult extends HashMetadata {
  hash: string;
}

const argonOptions: argon2.Options & { raw?: false } = {
  type: argon2.argon2id,
  memoryCost: env.PASSWORD_HASH_MEMORY_COST,
  timeCost: env.PASSWORD_HASH_TIME_COST,
  parallelism: env.PASSWORD_HASH_PARALLELISM
};

const determineAlgorithm = (hash: string): HashAlgorithm => {
  if (hash.startsWith('$argon2id$')) {
    return 'argon2id';
  }

  return 'bcrypt';
};

export const hashSecret = async (plain: string): Promise<HashResult> => {
  try {
    const hash = await argon2.hash(plain, argonOptions);
    return {
      hash,
      algorithm: 'argon2id',
      params: {
        memoryCost: env.PASSWORD_HASH_MEMORY_COST,
        timeCost: env.PASSWORD_HASH_TIME_COST,
        parallelism: env.PASSWORD_HASH_PARALLELISM
      }
    };
  } catch (error) {
    logger.warn('argon2 hashing failed, falling back to bcrypt', {
      error: error instanceof Error ? error.message : error
    });

    const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
    const hash = await bcrypt.hash(plain, salt);

    return {
      hash,
      algorithm: 'bcrypt',
      params: {
        rounds: env.BCRYPT_ROUNDS
      }
    };
  }
};

export const verifySecret = async (plain: string, hash: string): Promise<boolean> => {
  const algorithm = determineAlgorithm(hash);

  if (algorithm === 'argon2id') {
    return argon2.verify(hash, plain, argonOptions);
  }

  return bcrypt.compare(plain, hash);
};

export const needsRehash = (hash: string): boolean => {
  const algorithm = determineAlgorithm(hash);

  if (algorithm === 'argon2id') {
    try {
      return argon2.needsRehash(hash, argonOptions);
    } catch {
      return true;
    }
  }

  try {
    const parts = hash.split('$');
    if (parts.length < 3) {
      return true;
    }

    const rounds = parseInt(parts[2], 10);
    return Number.isNaN(rounds) || rounds < env.BCRYPT_ROUNDS;
  } catch {
    return true;
  }
};
