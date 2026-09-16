import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { dockerService } from '../services/docker-service.js';
import { activityService } from '../services/activity-service.js';

export const dockerController = {
  listContainers: asyncHandler(async (_request: Request, response: Response) => {
    const containers = await dockerService.listContainers();
    response.json({ containers });
  }),

  startContainer: asyncHandler(async (request: Request, response: Response) => {
    const id = request.params.id as string;
    await dockerService.startContainer(id);
    activityService.push({
      source: 'docker',
      level: 'info',
      message: `Started Docker container ${id.slice(0, 12)}`,
    });
    response.json({ ok: true, action: 'start', id });
  }),

  stopContainer: asyncHandler(async (request: Request, response: Response) => {
    const id = request.params.id as string;
    await dockerService.stopContainer(id);
    activityService.push({
      source: 'docker',
      level: 'info',
      message: `Stopped Docker container ${id.slice(0, 12)}`,
    });
    response.json({ ok: true, action: 'stop', id });
  }),

  restartContainer: asyncHandler(async (request: Request, response: Response) => {
    const id = request.params.id as string;
    await dockerService.restartContainer(id);
    activityService.push({
      source: 'docker',
      level: 'info',
      message: `Restarted Docker container ${id.slice(0, 12)}`,
    });
    response.json({ ok: true, action: 'restart', id });
  }),

  getContainerStats: asyncHandler(async (request: Request, response: Response) => {
    const id = request.params.id as string;
    const stats = await dockerService.getContainerStats(id);
    response.json(stats);
  }),
};
