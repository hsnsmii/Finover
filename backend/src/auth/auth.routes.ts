import { Router } from 'express';
import { authRateLimiter } from '../middleware/rateLimit.middleware';
import { requireAuth } from './auth.middleware';
import {
  changePasswordHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  registerHandler
} from './auth.controller';

const router = Router();

router.use(authRateLimiter);

router.post('/register', registerHandler);
router.post('/login', loginHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);
router.post('/change-password', requireAuth, changePasswordHandler);

export const authRouter = router;
