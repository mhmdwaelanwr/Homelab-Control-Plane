import { Router } from 'express';

import { screenController } from '../controllers/screen-controller.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rate-limit.js';
import { requireScreenControlPermission } from '../middleware/screen-permissions.js';

export const screenRouter = Router();

screenRouter.get('/status', requireAuth, screenController.status);
screenRouter.post('/connect', requireAuth, requireScreenControlPermission, createRateLimiter({ windowMs: 30_000, max: 10, message: 'Screen connect rate exceeded.' }), screenController.connect);
screenRouter.post('/disconnect', requireAuth, requireScreenControlPermission, createRateLimiter({ windowMs: 30_000, max: 10, message: 'Screen disconnect rate exceeded.' }), screenController.disconnect);
screenRouter.post('/reconnect', requireAuth, requireScreenControlPermission, createRateLimiter({ windowMs: 30_000, max: 10, message: 'Screen reconnect rate exceeded.' }), screenController.reconnect);
screenRouter.patch('/quality', requireAuth, requireScreenControlPermission, createRateLimiter({ windowMs: 30_000, max: 20, message: 'Screen quality rate exceeded.' }), screenController.setQuality);
screenRouter.get('/links', requireAuth, screenController.links);
screenRouter.post('/links', requireAuth, requireScreenControlPermission, createRateLimiter({ windowMs: 30_000, max: 20, message: 'Screen link rate exceeded.' }), screenController.createLink);
screenRouter.patch('/links/:id/control', requireAuth, requireScreenControlPermission, createRateLimiter({ windowMs: 30_000, max: 40, message: 'Screen link control rate exceeded.' }), screenController.controlLink);
screenRouter.delete('/links/:id', requireAuth, requireScreenControlPermission, createRateLimiter({ windowMs: 30_000, max: 20, message: 'Screen unlink rate exceeded.' }), screenController.deleteLink);
screenRouter.get('/audit', requireAuth, screenController.audit);
