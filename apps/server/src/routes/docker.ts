import { Router } from 'express';
import { dockerController } from '../controllers/docker-controller.js';
import { requireAuth } from '../middleware/auth.js';

export const dockerRouter = Router();

dockerRouter.use(requireAuth);

dockerRouter.get('/containers', dockerController.listContainers);
dockerRouter.post('/containers/:id/start', dockerController.startContainer);
dockerRouter.post('/containers/:id/stop', dockerController.stopContainer);
dockerRouter.post('/containers/:id/restart', dockerController.restartContainer);
dockerRouter.get('/containers/:id/stats', dockerController.getContainerStats);
