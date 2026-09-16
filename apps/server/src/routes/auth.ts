import { Router } from 'express';
import { authController } from '../controllers/auth-controller.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rate-limit.js';

export const authRouter = Router();

authRouter.post('/login', createRateLimiter({ windowMs: 60_000, max: 8, message: 'Too many login attempts.' }), authController.login);
authRouter.post('/logout', requireAuth, authController.logout);
authRouter.get('/me', requireAuth, authController.me);
authRouter.get('/session', requireAuth, authController.me);
