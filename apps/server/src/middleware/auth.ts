import type { NextFunction, Request, Response } from 'express';

import { authService } from '../services/auth-service.js';

export function extractBearerToken(request: Request) {
  const header = request.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined;
}

export function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = extractBearerToken(request);

  try {
    request.auth = authService.authenticate(token);
    next();
  } catch (error) {
    next(error);
  }
}

