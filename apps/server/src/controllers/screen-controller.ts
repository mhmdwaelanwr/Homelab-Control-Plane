import type { Request, Response } from 'express';

import { screenService } from '../services/screen-service.js';
import { asyncHandler } from '../utils/async-handler.js';

export const screenController = {
  status: asyncHandler(async (_request: Request, response: Response) => {
    response.json(await screenService.getStatus());
  }),

  connect: asyncHandler(async (_request: Request, response: Response) => {
    const actor = _request.auth ? { username: _request.auth.username, role: _request.auth.role } : undefined;
    const status = await screenService.connect(actor);
    response.json(status);
  }),

  disconnect: asyncHandler(async (request: Request, response: Response) => {
    const actor = request.auth ? { username: request.auth.username, role: request.auth.role } : undefined;
    const status = await screenService.disconnect(actor);
    response.json(status);
  }),

  reconnect: asyncHandler(async (request: Request, response: Response) => {
    const actor = request.auth ? { username: request.auth.username, role: request.auth.role } : undefined;
    const status = await screenService.reconnect(actor);
    response.json(status);
  }),

  links: asyncHandler(async (_request: Request, response: Response) => {
    response.json(screenService.getShareLinks());
  }),

  createLink: asyncHandler(async (request: Request, response: Response) => {
    const actor = request.auth ? { username: request.auth.username, role: request.auth.role } : undefined;
    const body = (request.body ?? {}) as { sourceDevice?: string; targetDevice?: string; label?: string };
    const snapshot = screenService.createShareLink({
      sourceDevice: body.sourceDevice ?? '',
      targetDevice: body.targetDevice ?? '',
      label: body.label,
    }, actor);
    response.status(201).json(snapshot);
  }),

  deleteLink: asyncHandler(async (request: Request, response: Response) => {
    const actor = request.auth ? { username: request.auth.username, role: request.auth.role } : undefined;
    const id = typeof request.params.id === 'string' ? request.params.id : '';
    response.json(screenService.removeShareLink(id, actor));
  }),

  controlLink: asyncHandler(async (request: Request, response: Response) => {
    const actor = request.auth ? { username: request.auth.username, role: request.auth.role } : undefined;
    const id = typeof request.params.id === 'string' ? request.params.id : '';
    const body = (request.body ?? {}) as { action?: 'start' | 'pause' | 'resume' | 'disconnect' };
    const action = body.action ?? 'resume';
    response.json(screenService.controlShareLink(id, action, actor));
  }),

  audit: asyncHandler(async (_request: Request, response: Response) => {
    response.json(screenService.getAudit());
  }),

  setQuality: asyncHandler(async (request: Request, response: Response) => {
    const actor = request.auth ? { username: request.auth.username, role: request.auth.role } : undefined;
    const body = (request.body ?? {}) as { quality?: 'low' | 'medium' | 'high' };
    const quality = body.quality ?? 'medium';
    response.json(screenService.setQuality(quality, actor));
  }),
};
