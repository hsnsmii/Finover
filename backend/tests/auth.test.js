"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const app_1 = __importDefault(require("../src/app"));
const client_1 = require("../src/db/client");
const password = 'StrongPassword123!';
const registerUser = async (email) => {
    const response = await (0, supertest_1.default)(app_1.default).post('/auth/register').send({ email, password });
    expect(response.status).toBe(201);
    return response.body;
};
describe('Authentication flow', () => {
    it('registers a user and stores hashed credentials', async () => {
        const email = 'register@test.com';
        const result = await registerUser(email);
        expect(result.user.email).toBe(email);
        expect(result.tokens.accessToken).toBeDefined();
        expect(result.tokens.refreshToken).toBeDefined();
        const user = await client_1.prisma.user.findUnique({ where: { email } });
        expect(user).toBeTruthy();
        expect(user?.passwordHash).not.toBe(password);
    });
    it('logs in and accesses protected resource', async () => {
        const email = 'login@test.com';
        await registerUser(email);
        const loginResponse = await (0, supertest_1.default)(app_1.default).post('/auth/login').send({ email, password });
        expect(loginResponse.status).toBe(200);
        const { accessToken } = loginResponse.body.tokens;
        const meResponse = await (0, supertest_1.default)(app_1.default).get('/me').set('Authorization', `Bearer ${accessToken}`);
        expect(meResponse.status).toBe(200);
        expect(meResponse.body.user.email).toBe(email);
    });
    it('rejects invalid login attempts', async () => {
        const email = 'invalid@test.com';
        await registerUser(email);
        const response = await (0, supertest_1.default)(app_1.default).post('/auth/login').send({ email, password: 'WrongPassword!' });
        expect(response.status).toBe(401);
        expect(response.body.code).toBe('AUTHENTICATION_ERROR');
    });
    it('rotates refresh tokens and revokes the previous token', async () => {
        const email = 'rotate@test.com';
        const registration = await registerUser(email);
        const initialRefreshToken = registration.tokens.refreshToken;
        const initialPayload = jsonwebtoken_1.default.decode(initialRefreshToken);
        expect(initialPayload?.jti).toBeDefined();
        const refreshResponse = await (0, supertest_1.default)(app_1.default)
            .post('/auth/refresh')
            .send({ refreshToken: initialRefreshToken });
        expect(refreshResponse.status).toBe(200);
        expect(refreshResponse.body.tokens.refreshToken).not.toBe(initialRefreshToken);
        const stored = await client_1.prisma.refreshToken.findUnique({ where: { jti: initialPayload?.jti } });
        expect(stored?.revokedAt).not.toBeNull();
    });
    it('detects refresh token reuse and revokes all tokens', async () => {
        const email = 'reuse@test.com';
        const registration = await registerUser(email);
        const initialRefreshToken = registration.tokens.refreshToken;
        const user = await client_1.prisma.user.findUnique({ where: { email } });
        expect(user).toBeTruthy();
        const refreshResponse = await (0, supertest_1.default)(app_1.default)
            .post('/auth/refresh')
            .send({ refreshToken: initialRefreshToken });
        expect(refreshResponse.status).toBe(200);
        const reuseResponse = await (0, supertest_1.default)(app_1.default)
            .post('/auth/refresh')
            .send({ refreshToken: initialRefreshToken });
        expect(reuseResponse.status).toBe(401);
        const tokens = await client_1.prisma.refreshToken.findMany({ where: { userId: user.id } });
        expect(tokens.every((token) => token.revokedAt !== null)).toBe(true);
    });
    it('revokes refresh token on logout', async () => {
        const email = 'logout@test.com';
        const registration = await registerUser(email);
        const payload = jsonwebtoken_1.default.decode(registration.tokens.refreshToken);
        const logoutResponse = await (0, supertest_1.default)(app_1.default)
            .post('/auth/logout')
            .send({ refreshToken: registration.tokens.refreshToken });
        expect(logoutResponse.status).toBe(204);
        const stored = await client_1.prisma.refreshToken.findUnique({ where: { jti: payload?.jti } });
        expect(stored?.revokedAt).not.toBeNull();
    });
    it('rehashes weak bcrypt passwords on login', async () => {
        const email = 'rehash@test.com';
        const salt = await bcryptjs_1.default.genSalt(8);
        const weakHash = await bcryptjs_1.default.hash(password, salt);
        const user = await client_1.prisma.user.create({
            data: {
                email,
                passwordHash: weakHash,
                passwordAlgo: 'bcrypt',
                passwordParamsJson: { rounds: 8 }
            }
        });
        const response = await (0, supertest_1.default)(app_1.default).post('/auth/login').send({ email, password });
        expect(response.status).toBe(200);
        const refreshedUser = await client_1.prisma.user.findUnique({ where: { id: user.id } });
        expect(refreshedUser?.passwordHash).toBeTruthy();
        expect(refreshedUser?.passwordHash).not.toBe(weakHash);
    });
    it('allows users to change password with valid current password', async () => {
        const email = 'change@test.com';
        const registration = await registerUser(email);
        const { accessToken } = registration.tokens;
        const newPassword = 'DifferentPass456!';
        const changeResponse = await (0, supertest_1.default)(app_1.default)
            .post('/auth/change-password')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ currentPassword: password, newPassword });
        expect(changeResponse.status).toBe(204);
        const oldPasswordLogin = await (0, supertest_1.default)(app_1.default).post('/auth/login').send({ email, password });
        expect(oldPasswordLogin.status).toBe(401);
        const newPasswordLogin = await (0, supertest_1.default)(app_1.default).post('/auth/login').send({ email, password: newPassword });
        expect(newPasswordLogin.status).toBe(200);
    });
    it('returns validation errors when required fields are missing', async () => {
        const response = await (0, supertest_1.default)(app_1.default).post('/auth/register').send({});
        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('errorId');
        expect(response.body.code).toBe('VALIDATION_ERROR');
    });
    it('requires access token for protected route', async () => {
        const response = await (0, supertest_1.default)(app_1.default).get('/me');
        expect(response.status).toBe(401);
    });
});
//# sourceMappingURL=auth.test.js.map