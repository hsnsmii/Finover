import type { User } from '@prisma/client';
import type { AuthResponseDto, AuthTokensDto, UserDto } from '../types/dto';

export const toUserDto = (user: User): UserDto => ({
  id: user.id,
  email: user.email,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString()
});

export const toAuthTokensDto = (tokens: {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}): AuthTokensDto => ({
  accessToken: tokens.accessToken,
  accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
  refreshToken: tokens.refreshToken,
  refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString()
});

export const buildAuthResponse = (user: User, tokens: {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}): AuthResponseDto => ({
  user: toUserDto(user),
  tokens: toAuthTokensDto(tokens)
});
