export interface UserDto {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokensDto {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface AuthResponseDto {
  user: UserDto;
  tokens: AuthTokensDto;
}
