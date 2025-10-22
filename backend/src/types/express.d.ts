import type { AccessTokenPayload } from '../auth/token.service';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      requestId?: string;
    }

    interface Locals {
      requestId?: string;
      userId?: string;
    }
  }
}

export {};
