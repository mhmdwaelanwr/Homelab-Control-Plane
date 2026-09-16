import { Router } from 'express';
import { systemController } from '../controllers/system-controller.js';
import { requireAuth } from '../middleware/auth.js';

export const systemRouter = Router();

systemRouter.use(requireAuth);

systemRouter.get('/dashboard', systemController.dashboard);
systemRouter.get('/overview', systemController.overview);
systemRouter.get('/activity', systemController.activity);
systemRouter.get('/cpu', systemController.cpu);
systemRouter.get('/ram', systemController.ram);
systemRouter.get('/storage', systemController.storage);
systemRouter.get('/network', systemController.network);
systemRouter.get('/devices', systemController.devices);
systemRouter.get('/services-health', systemController.servicesHealth);
systemRouter.get('/insights', systemController.insights);
systemRouter.get('/business', systemController.business);
