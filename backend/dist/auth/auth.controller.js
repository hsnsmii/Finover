"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordHandler = exports.meHandler = exports.logoutHandler = exports.refreshHandler = exports.loginHandler = exports.registerHandler = void 0;
const zod_1 = require("zod");
const errors_1 = require("../types/errors");
const auth_service_1 = require("./auth.service");
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters')
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, 'Password is required')
});
const refreshSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(10, 'Refresh token is required')
});
const changePasswordSchema = zod_1.z
    .object({
    currentPassword: zod_1.z.string().min(8, 'Current password must be at least 8 characters'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters')
})
    .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword']
});
const registerHandler = async (req, res, next) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return next(new errors_1.ValidationError('Invalid registration payload', parsed.error.flatten()));
    }
    try {
        const result = await (0, auth_service_1.register)(parsed.data.email, parsed.data.password);
        res.status(201).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.registerHandler = registerHandler;
const loginHandler = async (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return next(new errors_1.ValidationError('Invalid login payload', parsed.error.flatten()));
    }
    try {
        const result = await (0, auth_service_1.login)(parsed.data.email, parsed.data.password);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.loginHandler = loginHandler;
const refreshHandler = async (req, res, next) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
        return next(new errors_1.ValidationError('Refresh token is required', parsed.error.flatten()));
    }
    try {
        const result = await (0, auth_service_1.refreshTokens)(parsed.data.refreshToken);
        res.status(200).json(result);
    }
    catch (error) {
        next(error);
    }
};
exports.refreshHandler = refreshHandler;
const logoutHandler = async (req, res, next) => {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
        return next(new errors_1.ValidationError('Refresh token is required', parsed.error.flatten()));
    }
    try {
        await (0, auth_service_1.logout)(parsed.data.refreshToken);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.logoutHandler = logoutHandler;
const meHandler = async (req, res, next) => {
    if (!req.user?.sub) {
        return next(new errors_1.ValidationError('Missing authenticated user'));
    }
    try {
        const user = await (0, auth_service_1.getCurrentUser)(req.user.sub);
        res.status(200).json({ user });
    }
    catch (error) {
        next(error);
    }
};
exports.meHandler = meHandler;
const changePasswordHandler = async (req, res, next) => {
    if (!req.user?.sub) {
        return next(new errors_1.ValidationError('Missing authenticated user'));
    }
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
        return next(new errors_1.ValidationError('Invalid password payload', parsed.error.flatten()));
    }
    try {
        await (0, auth_service_1.changePassword)(req.user.sub, parsed.data.currentPassword, parsed.data.newPassword);
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
};
exports.changePasswordHandler = changePasswordHandler;
//# sourceMappingURL=auth.controller.js.map