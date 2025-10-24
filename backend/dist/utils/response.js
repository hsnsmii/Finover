"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuthResponse = exports.toAuthTokensDto = exports.toUserDto = void 0;
const toUserDto = (user) => ({
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
});
exports.toUserDto = toUserDto;
const toAuthTokensDto = (tokens) => ({
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
    refreshToken: tokens.refreshToken,
    refreshTokenExpiresAt: tokens.refreshTokenExpiresAt.toISOString()
});
exports.toAuthTokensDto = toAuthTokensDto;
const buildAuthResponse = (user, tokens) => ({
    user: (0, exports.toUserDto)(user),
    tokens: (0, exports.toAuthTokensDto)(tokens)
});
exports.buildAuthResponse = buildAuthResponse;
//# sourceMappingURL=response.js.map