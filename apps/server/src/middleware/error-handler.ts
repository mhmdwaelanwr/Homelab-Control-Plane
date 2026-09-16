import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../utils/app-error.js';

export function notFoundHandler(request: Request, _response: Response, next: NextFunction) {
  next(new AppError(404, `Route ${request.method} ${request.originalUrl} was not found.`, 'ROUTE_NOT_FOUND'));
}

export function errorHandler(error: unknown, _request: Request, response: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    response.status(400).json({
      message: 'Request validation failed.',
      code: 'VALIDATION_ERROR',
      details: error.flatten(),
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      message: error.message,
      code: error.code,
      details: error.details,
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unexpected server error.';
  response.status(500).json({
    message,
    code: 'INTERNAL_SERVER_ERROR',
  });
}
