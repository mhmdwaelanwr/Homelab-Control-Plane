import type { Request, Response } from 'express';

import { systemService } from '../services/system-service.js';
import { serviceHealthService } from '../services/service-health-service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { activityService } from '../services/activity-service.js';

export const systemController = {
  dashboard: asyncHandler(async (_request: Request, response: Response) => {
    response.json(await systemService.getPayload());
  }),

  overview: asyncHandler(async (_request: Request, response: Response) => {
    response.json(await systemService.getOverview());
  }),

  activity: asyncHandler(async (request: Request, response: Response) => {
    const rawLimit = typeof request.query.limit === 'string' ? Number(request.query.limit) : 12;
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(40, rawLimit)) : 12;
    response.json(activityService.recent(limit));
  }),

  cpu: asyncHandler(async (_request: Request, response: Response) => {
    response.json(await systemService.getCpu());
  }),

  ram: asyncHandler(async (_request: Request, response: Response) => {
    response.json(await systemService.getRam());
  }),

  storage: asyncHandler(async (_request: Request, response: Response) => {
    response.json(await systemService.getStorage());
  }),

  network: asyncHandler(async (_request: Request, response: Response) => {
    response.json(await systemService.getNetwork());
  }),

  devices: asyncHandler(async (_request: Request, response: Response) => {
    response.json(await systemService.getConnectedDevices());
  }),

  insights: asyncHandler(async (_request: Request, response: Response) => {
    response.json(await systemService.getInsights());
  }),

  business: asyncHandler(async (_request: Request, response: Response) => {
    response.json(await systemService.getBusiness());
  }),

  servicesHealth: asyncHandler(async (_request: Request, response: Response) => {
    response.json(await serviceHealthService.getSnapshot());
  }),
};
