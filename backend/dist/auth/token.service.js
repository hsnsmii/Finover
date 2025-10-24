"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotateRefreshToken = exports.issueTokens = exports.revokeAllRefreshTokensForUser = exports.markRefreshTokenRevoked = exports.findRefreshTokenByJti = exports.persistRefreshToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const nanoid_1 = require("nanoid");
const client_1 = require("../db/client");
const env_1 = require("../config/env");
const errors_1 = require("../types/errors");
const password_service_1 = require("./password.service");
const decodeExpiration = (token, fallbackMs) => {
    const decoded = jsonwebtoken_1.default.decode(token);
    if (decoded && typeof decoded === 'object' && typeof decoded.exp === 'number') {
        return new Date(decoded.exp * 1000);
    }
    return new Date(Date.now() + fallbackMs);
};
const buildAccessPayload = (userId, roles) => ({
    sub: userId,
    jti: (0, nanoid_1.nanoid)(),
    type: 'access',
    roles
});
const buildRefreshPayload = (userId) => ({
    sub: userId,
    jti: (0, nanoid_1.nanoid)(),
    type: 'refresh'
});
const generateAccessToken = (userId, roles) => {
    const payload = buildAccessPayload(userId, roles);
    const options = {
        issuer: env_1.env.JWT_ISS,
        audience: env_1.env.JWT_AUD,
        expiresIn: env_1.env.ACCESS_TTL,
        jwtid: payload.jti
    };
    const token = jsonwebtoken_1.default.sign({ sub: payload.sub, type: payload.type, roles: payload.roles }, env_1.env.JWT_ACCESS_SECRET, options);
    return {
        token,
        payload: {
            ...payload,
            exp: jsonwebtoken_1.default.decode(token, { json: true })?.exp ?? undefined
        },
        expiresAt: decodeExpiration(token, env_1.env.ACCESS_TTL_MS)
    };
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (userId) => {
    const payload = buildRefreshPayload(userId);
    const options = {
        issuer: env_1.env.JWT_ISS,
        audience: env_1.env.JWT_AUD,
        expiresIn: env_1.env.REFRESH_TTL,
        jwtid: payload.jti
    };
    const token = jsonwebtoken_1.default.sign({ sub: payload.sub, type: payload.type }, env_1.env.JWT_REFRESH_SECRET, options);
    return {
        token,
        payload: {
            ...payload,
            exp: jsonwebtoken_1.default.decode(token, { json: true })?.exp ?? undefined
        },
        expiresAt: decodeExpiration(token, env_1.env.REFRESH_TTL_MS)
    };
};
exports.generateRefreshToken = generateRefreshToken;
const ensureAccessPayload = (payload) => {
    if (payload.type !== 'access' || typeof payload.sub !== 'string' || typeof payload.jti !== 'string') {
        throw new errors_1.AuthError('Invalid access token payload');
    }
    return payload;
};
const ensureRefreshPayload = (payload) => {
    if (payload.type !== 'refresh' || typeof payload.sub !== 'string' || typeof payload.jti !== 'string') {
        throw new errors_1.AuthError('Invalid refresh token payload');
    }
    return payload;
};
const verifyAccessToken = (token) => {
    const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET, {
        algorithms: ['HS256', 'HS384', 'HS512'],
        audience: env_1.env.JWT_AUD,
        issuer: env_1.env.JWT_ISS,
        clockTolerance: env_1.env.CLOCK_TOLERANCE_SECONDS
    });
    if (typeof payload === 'string') {
        throw new errors_1.AuthError('Invalid access token payload');
    }
    return ensureAccessPayload(payload);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_REFRESH_SECRET, {
        algorithms: ['HS256', 'HS384', 'HS512'],
        audience: env_1.env.JWT_AUD,
        issuer: env_1.env.JWT_ISS,
        clockTolerance: env_1.env.CLOCK_TOLERANCE_SECONDS
    });
    if (typeof payload === 'string') {
        throw new errors_1.AuthError('Invalid refresh token payload');
    }
    return ensureRefreshPayload(payload);
};
exports.verifyRefreshToken = verifyRefreshToken;
const persistRefreshToken = async (userId, refreshToken, jti, expiresAt) => {
    const { hash } = await (0, password_service_1.hashSecret)(refreshToken);
    await client_1.prisma.refreshToken.create({
        data: {
            userId,
            jti,
            tokenHash: hash,
            expiresAt
        }
    });
};
exports.persistRefreshToken = persistRefreshToken;
const findRefreshTokenByJti = async (jti) => {
    return client_1.prisma.refreshToken.findUnique({
        where: { jti }
    });
};
exports.findRefreshTokenByJti = findRefreshTokenByJti;
const markRefreshTokenRevoked = async (id) => {
    await client_1.prisma.refreshToken.update({
        where: { id },
        data: {
            revokedAt: new Date()
        }
    });
};
exports.markRefreshTokenRevoked = markRefreshTokenRevoked;
const revokeAllRefreshTokensForUser = async (userId) => {
    await client_1.prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
    });
};
exports.revokeAllRefreshTokensForUser = revokeAllRefreshTokensForUser;
const verifyStoredRefreshToken = async (token, stored) => {
    const isValid = await (0, password_service_1.verifySecret)(token, stored.tokenHash);
    if (!isValid) {
        throw new errors_1.AuthError('Refresh token mismatch');
    }
    if ((0, password_service_1.needsRehash)(stored.tokenHash)) {
        const { hash } = await (0, password_service_1.hashSecret)(token);
        await client_1.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { tokenHash: hash }
        });
    }
};
const issueTokens = async (userId, roles) => {
    const access = (0, exports.generateAccessToken)(userId, roles);
    const refresh = (0, exports.generateRefreshToken)(userId);
    await (0, exports.persistRefreshToken)(userId, refresh.token, refresh.payload.jti, refresh.expiresAt);
    return {
        accessToken: access.token,
        accessTokenExpiresAt: access.expiresAt,
        refreshToken: refresh.token,
        refreshTokenExpiresAt: refresh.expiresAt,
        refreshJti: refresh.payload.jti
    };
};
exports.issueTokens = issueTokens;
const rotateRefreshToken = async (stored, providedToken) => {
    await verifyStoredRefreshToken(providedToken, stored);
    const refresh = (0, exports.generateRefreshToken)(stored.userId);
    const { hash } = await (0, password_service_1.hashSecret)(refresh.token);
    await client_1.prisma.$transaction([
        client_1.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revokedAt: new Date() }
        }),
        client_1.prisma.refreshToken.create({
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
exports.rotateRefreshToken = rotateRefreshToken;
//# sourceMappingURL=token.service.js.map