"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const rateLimit_middleware_1 = require("../middleware/rateLimit.middleware");
const auth_middleware_1 = require("./auth.middleware");
const auth_controller_1 = require("./auth.controller");
const router = (0, express_1.Router)();
router.use(rateLimit_middleware_1.authRateLimiter);
router.post('/register', auth_controller_1.registerHandler);
router.post('/login', auth_controller_1.loginHandler);
router.post('/refresh', auth_controller_1.refreshHandler);
router.post('/logout', auth_controller_1.logoutHandler);
router.post('/change-password', auth_middleware_1.requireAuth, auth_controller_1.changePasswordHandler);
exports.authRouter = router;
//# sourceMappingURL=auth.routes.js.map