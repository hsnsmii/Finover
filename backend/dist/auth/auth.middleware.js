"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const errors_1 = require("../types/errors");
const token_service_1 = require("./token.service");
const requireAuth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return next(new errors_1.AuthError('Authorization header missing'));
    }
    const token = header.replace('Bearer ', '').trim();
    if (!token) {
        return next(new errors_1.AuthError('Access token missing'));
    }
    try {
        const payload = (0, token_service_1.verifyAccessToken)(token);
        req.user = payload;
        res.locals.userId = payload.sub;
        return next();
    }
    catch (error) {
        return next(new errors_1.AuthError('Invalid or expired access token'));
    }
};
exports.requireAuth = requireAuth;
//# sourceMappingURL=auth.middleware.js.map