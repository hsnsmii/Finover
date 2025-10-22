import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import type { RefreshToken } from '@prisma/client';
import { prisma } from '../db/client';
import { env } from '../config/env';
import { AuthError } from '../types/errors';
import { hashSecret, needsRehash, verifySecret } from './password.service';

export interface AccessTokenPayload extends jwt.JwtPayload {
  sub: string;
  jti: string;
  type: 'access';
  roles?: string[];
}

export interface RefreshTokenPayload extends jwt.JwtPayload {
  sub: string;
  jti: string;
  type: 'refresh';
}

export interface IssuedTokens {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  refreshJti: string;
}

const decodeExpiration = (token: string, fallbackMs: number) => {
  const decoded = jwt.decode(token);
  if (decoded && typeof decoded === 'object' && typeof decoded.exp === 'number') {
    return new Date(decoded.exp * 1000);
  }

  return new Date(Date.now() + fallbackMs);
};

const buildAccessPayload = (userId: string, roles?: string[]): AccessTokenPayload => ({
  sub: userId,
  jti: nanoid(),
  type: 'access',
  roles
});

const buildRefreshPayload = (userId: string): RefreshTokenPayload => ({
  sub: userId,
  jti: nanoid(),
  type: 'refresh'
});

export const generateAccessToken = (userId: string, roles?: string[]) => {
  const payload = buildAccessPayload(userId, roles);
  const token = jwt.sign(
    { sub: payload.sub, type: payload.type, roles: payload.roles },
    env.JWT_ACCESS_SECRET,
    {
      issuer: env.JWT_ISS,
      audience: env.JWT_AUD,
      expiresIn: env.ACCESS_TTL,
      jwtid: payload.jti
    }
  );

  return {
    token,
    payload: {
      ...payload,
      exp: jwt.decode(token, { json: true })?.exp ?? undefined
    },
    expiresAt: decodeExpiration(token, env.ACCESS_TTL_MS)
  };
};

export const generateRefreshToken = (userId: string) => {
  const payload = buildRefreshPayload(userId);
  const token = jwt.sign(
    { sub: payload.sub, type: payload.type },
    env.JWT_REFRESH_SECRET,
    {
      issuer: env.JWT_ISS,
      audience: env.JWT_AUD,
      expiresIn: env.REFRESH_TTL,
      jwtid: payload.jti
    }
  );

  return {
    token,
    payload: {
      ...payload,
      exp: jwt.decode(token, { json: true })?.exp ?? undefined
    },
    expiresAt: decodeExpiration(token, env.REFRESH_TTL_MS)
  };
};

const ensureAccessPayload = (payload: jwt.JwtPayload): AccessTokenPayload => {
  if (payload.type !== 'access' || typeof payload.sub !== 'string' || typeof payload.jti !== 'string') {
    throw new AuthError('Invalid access token payload');
  }

  return payload as AccessTokenPayload;
};

const ensureRefreshPayload = (payload: jwt.JwtPayload): RefreshTokenPayload => {
  if (payload.type !== 'refresh' || typeof payload.sub !== 'string' || typeof payload.jti !== 'string') {
    throw new AuthError('Invalid refresh token payload');
  }

  return payload as RefreshTokenPayload;
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: ['HS256', 'HS384', 'HS512'],
    audience: env.JWT_AUD,
    issuer: env.JWT_ISS,
    clockTolerance: env.CLOCK_TOLERANCE_SECONDS
  });

  if (typeof payload === 'string') {
    throw new AuthError('Invalid access token payload');
  }

  return ensureAccessPayload(payload);
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: ['HS256', 'HS384', 'HS512'],
    audience: env.JWT_AUD,
    issuer: env.JWT_ISS,
    clockTolerance: env.CLOCK_TOLERANCE_SECONDS
  });

  if (typeof payload === 'string') {
    throw new AuthError('Invalid refresh token payload');
  }

  return ensureRefreshPayload(payload);
};

export const persistRefreshToken = async (userId: string, refreshToken: string, jti: string, expiresAt: Date) => {
  const { hash } = await hashSecret(refreshToken);

  await prisma.refreshToken.create({
    data: {
      userId,
      jti,
      tokenHash: hash,
      expiresAt
    }
  });
};

export const findRefreshTokenByJti = async (jti: string) => {
  return prisma.refreshToken.findUnique({
    where: { jti }
  });
};

export const markRefreshTokenRevoked = async (id: string) => {
  await prisma.refreshToken.update({
    where: { id },
    data: {
      revokedAt: new Date()
    }
  });
};

export const revokeAllRefreshTokensForUser = async (userId: string) => {
  await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() }
  });
};

const verifyStoredRefreshToken = async (token: string, stored: RefreshToken) => {
  const isValid = await verifySecret(token, stored.tokenHash);
  if (!isValid) {
    throw new AuthError('Refresh token mismatch');
  }

  if (needsRehash(stored.tokenHash)) {
    const { hash } = await hashSecret(token);
    await prisma.refreshToken.update({
      where: { id: stored.id },
      data: { tokenHash: hash }
    });
  }
};

export const issueTokens = async (userId: string, roles?: string[]): Promise<IssuedTokens> => {
  const access = generateAccessToken(userId, roles);
  const refresh = generateRefreshToken(userId);

  await persistRefreshToken(userId, refresh.token, refresh.payload.jti, refresh.expiresAt);

  return {
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt,
    refreshToken: refresh.token,
    refreshTokenExpiresAt: refresh.expiresAt,
    refreshJti: refresh.payload.jti
  };
};

export const rotateRefreshToken = async (stored: RefreshToken, providedToken: string) => {
  await verifyStoredRefreshToken(providedToken, stored);

  const refresh = generateRefreshToken(stored.userId);

  const { hash } = await hashSecret(refresh.token);

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() }
    }),
    prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        jti: refresh.payload.jti,
        tokenHash: hash,
        expiresAt: refresh.expiresAt
      }
    })
  ]);

  return {
    refreshToken: refresh.token,
    refreshTokenExpiresAt: refresh.expiresAt,
    refreshJti: refresh.payload.jti
  };
};
