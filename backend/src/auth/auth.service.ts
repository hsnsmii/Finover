import type { User } from '@prisma/client';
import { prisma } from '../db/client';
import { AuthError, ConflictError, ValidationError } from '../types/errors';
import { hashSecret, needsRehash, verifySecret } from './password.service';
import {
  findRefreshTokenByJti,
  issueTokens,
  markRefreshTokenRevoked,
  revokeAllRefreshTokensForUser,
  rotateRefreshToken,
  verifyRefreshToken,
  generateAccessToken
} from './token.service';
import { delay } from '../utils/delay';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { buildAuthResponse, toUserDto } from '../utils/response';
import type { AuthResponseDto } from '../types/dto';

export const register = async (email: string, password: string): Promise<AuthResponseDto> => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ConflictError('Email already registered');
  }

  const hashed = await hashSecret(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashed.hash,
      passwordAlgo: hashed.algorithm,
      passwordParamsJson: hashed.params
    }
  });

  const tokens = await issueTokens(user.id);

  logger.info('User registered', { userId: user.id });

  return buildAuthResponse(user, tokens);
};

export const login = async (email: string, password: string): Promise<AuthResponseDto> => {
  const user = await prisma.user.findUnique({ where: { email } });

  await delay(env.LOGIN_DELAY_MS);

  if (!user) {
    throw new AuthError('Invalid email or password');
  }

  const validPassword = await verifySecret(password, user.passwordHash);

  if (!validPassword) {
    throw new AuthError('Invalid email or password');
  }

  if (needsRehash(user.passwordHash)) {
    const hashed = await hashSecret(password);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashed.hash,
        passwordAlgo: hashed.algorithm,
        passwordParamsJson: hashed.params
      }
    });
  }

  const tokens = await issueTokens(user.id);

  logger.info('User logged in', { userId: user.id });

  return buildAuthResponse(user, tokens);
};

export const refreshTokens = async (refreshToken: string): Promise<AuthResponseDto> => {
  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AuthError('Invalid refresh token');
  }

  const stored = await findRefreshTokenByJti(payload.jti);

  if (!stored) {
    throw new AuthError('Invalid refresh token');
  }

  if (stored.userId !== payload.sub) {
    await revokeAllRefreshTokensForUser(stored.userId);
    throw new AuthError('Refresh token subject mismatch');
  }

  if (stored.revokedAt) {
    await revokeAllRefreshTokensForUser(stored.userId);
    throw new AuthError('Refresh token reuse detected');
  }

  if (stored.expiresAt < new Date()) {
    await markRefreshTokenRevoked(stored.id);
    throw new AuthError('Refresh token expired');
  }

  const rotated = await rotateRefreshToken(stored, refreshToken);
  const access = generateAccessToken(stored.userId);

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });

  if (!user) {
    throw new ValidationError('User not found');
  }

  logger.info('Refresh token rotated', { userId: user.id, oldJti: stored.jti, newJti: rotated.refreshJti });

  return buildAuthResponse(user, {
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt,
    refreshToken: rotated.refreshToken,
    refreshTokenExpiresAt: rotated.refreshTokenExpiresAt
  });
};

export const logout = async (refreshToken: string) => {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new AuthError('Invalid refresh token');
  }

  const stored = await findRefreshTokenByJti(payload.jti);

  if (!stored) {
    return;
  }

  if (stored.userId !== payload.sub) {
    await revokeAllRefreshTokensForUser(stored.userId);
    throw new AuthError('Refresh token subject mismatch');
  }

  if (stored.revokedAt) {
    await revokeAllRefreshTokensForUser(stored.userId);
    return;
  }

  const isValid = await verifySecret(refreshToken, stored.tokenHash);

  if (!isValid) {
    await revokeAllRefreshTokensForUser(stored.userId);
    throw new AuthError('Refresh token mismatch');
  }

  await markRefreshTokenRevoked(stored.id);
  logger.info('Refresh token revoked via logout', { userId: stored.userId, jti: stored.jti });
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ValidationError('User not found');
  }

  return toUserDto(user);
};

export const changePassword = async (userId: string, currentPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new ValidationError('User not found');
  }

  const isValid = await verifySecret(currentPassword, user.passwordHash);

  if (!isValid) {
    throw new AuthError('Current password is incorrect');
  }

  const hashed = await hashSecret(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: hashed.hash,
      passwordAlgo: hashed.algorithm,
      passwordParamsJson: hashed.params
    }
  });

  logger.info('User changed password', { userId: user.id });
};
