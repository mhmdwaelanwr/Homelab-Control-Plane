import { Router } from 'express';

import { terminalController } from '../controllers/terminal-controller.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rate-limit.js';

export const terminalRouter = Router();

terminalRouter.use(requireAuth);

terminalRouter.get('/presets', terminalController.presets);
terminalRouter.post('/execute', createRateLimiter({ windowMs: 60_000, max: 45, message: 'Terminal command rate exceeded.' }), terminalController.execute);
