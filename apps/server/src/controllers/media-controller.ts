import { createReadStream } from 'node:fs';

import type { Request, Response } from 'express';

import { authService } from '../services/auth-service.js';
import { mediaService } from '../services/media-service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { AppError } from '../utils/app-error.js';
import { extractBearerToken } from '../middleware/auth.js';
import { mediaStatusQuerySchema, mediaStreamQuerySchema, startBroadcastSchema } from '../validators/media.js';

function extractMediaStreamToken(request: Request) {
  return extractBearerToken(request) ?? (typeof request.query.token === 'string' ? request.query.token : undefined);
}

export const mediaController = {
  status: asyncHandler(async (_request: Request, response: Response) => {
    response.json(mediaService.getStatus());
  }),

  library: asyncHandler(async (request: Request, response: Response) => {
    const query = mediaStatusQuerySchema.parse(request.query);
    response.json(await mediaService.listLibrary(query.path));
  }),

  start: asyncHandler(async (request: Request, response: Response) => {
    const payload = startBroadcastSchema.parse(request.body);
    response.json(await mediaService.startBroadcast(payload));
  }),

  pause: asyncHandler(async (_request: Request, response: Response) => {
    response.json(mediaService.pauseBroadcast());
  }),

  resume: asyncHandler(async (_request: Request, response: Response) => {
    response.json(mediaService.resumeBroadcast());
  }),

  stop: asyncHandler(async (_request: Request, response: Response) => {
    response.json(mediaService.stopBroadcast());
  }),

  stream: asyncHandler(async (request: Request, response: Response) => {
    const query = mediaStreamQuerySchema.parse(request.query);
    authService.authenticate(extractMediaStreamToken(request));

    const source = await mediaService.resolveStreamSource(query.path);
    const range = request.headers.range;

    if (!range) {
      response.writeHead(200, {
        'Content-Type': source.mimeType,
        'Content-Length': source.size,
        'Accept-Ranges': 'bytes',
        'Content-Disposition': `inline; filename="${source.filename}"`,
      });
      createReadStream(source.absolute).pipe(response);
      return;
    }

    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match) {
      throw new AppError(416, 'Invalid range header.', 'INVALID_RANGE_HEADER');
    }

    const start = match[1] ? Number.parseInt(match[1], 10) : 0;
    const end = match[2] ? Number.parseInt(match[2], 10) : source.size - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || end >= source.size) {
      throw new AppError(416, 'Requested media range is invalid.', 'MEDIA_RANGE_INVALID');
    }

    response.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${source.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': source.mimeType,
      'Content-Disposition': `inline; filename="${source.filename}"`,
    });
    createReadStream(source.absolute, { start, end }).pipe(response);
  }),
};