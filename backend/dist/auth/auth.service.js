"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.getCurrentUser = exports.logout = exports.refreshTokens = exports.login = exports.register = void 0;
const client_1 = require("../db/client");
const errors_1 = require("../types/errors");
const password_service_1 = require("./password.service");
const token_service_1 = require("./token.service");
const delay_1 = require("../utils/delay");
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const response_1 = require("../utils/response");
const register = async (email, password) => {
    const existing = await client_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new errors_1.ConflictError('Email already registered');
    }
    const hashed = await (0, password_service_1.hashSecret)(password);
    const user = await client_1.prisma.user.create({
        data: {
            email,
            passwordHash: hashed.hash,
            passwordAlgo: hashed.algorithm,
            passwordParamsJson: hashed.params
        }
    });
    const tokens = await (0, token_service_1.issueTokens)(user.id);
    logger_1.logger.info('User registered', { userId: user.id });
    return (0, response_1.buildAuthResponse)(user, tokens);
};
exports.register = register;
const login = async (email, password) => {
    const user = await client_1.prisma.user.findUnique({ where: { email } });
    await (0, delay_1.delay)(env_1.env.LOGIN_DELAY_MS);
    if (!user) {
        throw new errors_1.AuthError('Invalid email or password');
    }
    const validPassword = await (0, password_service_1.verifySecret)(password, user.passwordHash);
    if (!validPassword) {
        throw new errors_1.AuthError('Invalid email or password');
    }
    if ((0, password_service_1.needsRehash)(user.passwordHash)) {
        const hashed = await (0, password_service_1.hashSecret)(password);
        await client_1.prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashed.hash,
                passwordAlgo: hashed.algorithm,
                passwordParamsJson: hashed.params
            }
        });
    }
    const tokens = await (0, token_service_1.issueTokens)(user.id);
    logger_1.logger.info('User logged in', { userId: user.id });
    return (0, response_1.buildAuthResponse)(user, tokens);
};
exports.login = login;
const refreshTokens = async (refreshToken) => {
    let payload;
    try {
        payload = (0, token_service_1.verifyRefreshToken)(refreshToken);
    }
    catch (error) {
        throw new errors_1.AuthError('Invalid refresh token');
    }
    const stored = await (0, token_service_1.findRefreshTokenByJti)(payload.jti);
    if (!stored) {
        throw new errors_1.AuthError('Invalid refresh token');
    }
    if (stored.userId !== payload.sub) {
        await (0, token_service_1.revokeAllRefreshTokensForUser)(stored.userId);
        throw new errors_1.AuthError('Refresh token subject mismatch');
    }
    if (stored.revokedAt) {
        await (0, token_service_1.revokeAllRefreshTokensForUser)(stored.userId);
        throw new errors_1.AuthError('Refresh token reuse detected');
    }
    if (stored.expiresAt < new Date()) {
        await (0, token_service_1.markRefreshTokenRevoked)(stored.id);
        throw new errors_1.AuthError('Refresh token expired');
    }
    const rotated = await (0, token_service_1.rotateRefreshToken)(stored, refreshToken);
    const access = (0, token_service_1.generateAccessToken)(stored.userId);
    const user = await client_1.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) {
        throw new errors_1.ValidationError('User not found');
    }
    logger_1.logger.info('Refresh token rotated', { userId: user.id, oldJti: stored.jti, newJti: rotated.refreshJti });
    return (0, response_1.buildAuthResponse)(user, {
        accessToken: access.token,
        accessTokenExpiresAt: access.expiresAt,
        refreshToken: rotated.refreshToken,
        refreshTokenExpiresAt: rotated.refreshTokenExpiresAt
    });
};
exports.refreshTokens = refreshTokens;
const logout = async (refreshToken) => {
    let payload;
    try {
        payload = (0, token_service_1.verifyRefreshToken)(refreshToken);
    }
    catch (error) {
        throw new errors_1.AuthError('Invalid refresh token');
    }
    const stored = await (0, token_service_1.findRefreshTokenByJti)(payload.jti);
    if (!stored) {
        return;
    }
    if (stored.userId !== payload.sub) {
        await (0, token_service_1.revokeAllRefreshTokensForUser)(stored.userId);
        throw new errors_1.AuthError('Refresh token subject mismatch');
    }
    if (stored.revokedAt) {
        await (0, token_service_1.revokeAllRefreshTokensForUser)(stored.userId);
        return;
    }
    const isValid = await (0, password_service_1.verifySecret)(refreshToken, stored.tokenHash);
    if (!isValid) {
        await (0, token_service_1.revokeAllRefreshTokensForUser)(stored.userId);
        throw new errors_1.AuthError('Refresh token mismatch');
    }
    await (0, token_service_1.markRefreshTokenRevoked)(stored.id);
    logger_1.logger.info('Refresh token revoked via logout', { userId: stored.userId, jti: stored.jti });
};
exports.logout = logout;
const getCurrentUser = async (userId) => {
    const user = await client_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new errors_1.ValidationError('User not found');
    }
    return (0, response_1.toUserDto)(user);
};
exports.getCurrentUser = getCurrentUser;
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await client_1.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        throw new errors_1.ValidationError('User not found');
    }
    const isValid = await (0, password_service_1.verifySecret)(currentPassword, user.passwordHash);
    if (!isValid) {
        throw new errors_1.AuthError('Current password is incorrect');
    }
    const hashed = await (0, password_service_1.hashSecret)(newPassword);
    await client_1.prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash: hashed.hash,
            passwordAlgo: hashed.algorithm,
            passwordParamsJson: hashed.params
        }
    });
    logger_1.logger.info('User changed password', { userId: user.id });
};
exports.changePassword = changePassword;
//# sourceMappingURL=auth.service.js.map