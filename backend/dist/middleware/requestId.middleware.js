"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
const uuid_1 = require("uuid");
const requestIdMiddleware = (req, res, next) => {
    const headerId = req.headers['x-request-id'];
    const requestId = typeof headerId === 'string' && headerId.trim().length > 0 ? headerId : (0, uuid_1.v4)();
    req.requestId = requestId;
    res.locals.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
//# sourceMappingURL=requestId.middleware.js.map