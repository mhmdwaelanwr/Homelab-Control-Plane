import { Router } from 'express';

import { mediaController } from '../controllers/media-controller.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rate-limit.js';

export const mediaRouter = Router();

mediaRouter.get('/stream', mediaController.stream);
mediaRouter.use(requireAuth);
mediaRouter.get('/status', mediaController.status);
mediaRouter.get('/library', mediaController.library);
mediaRouter.post('/start', createRateLimiter({ windowMs: 30_000, max: 12, message: 'Media start rate exceeded.' }), mediaController.start);
mediaRouter.post('/pause', createRateLimiter({ windowMs: 30_000, max: 20, message: 'Media pause rate exceeded.' }), mediaController.pause);
mediaRouter.post('/resume', createRateLimiter({ windowMs: 30_000, max: 20, message: 'Media resume rate exceeded.' }), mediaController.resume);
mediaRouter.post('/stop', createRateLimiter({ windowMs: 30_000, max: 20, message: 'Media stop rate exceeded.' }), mediaController.stop);