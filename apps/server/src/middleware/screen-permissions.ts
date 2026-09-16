import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/app-error.js';

export function requireScreenControlPermission(request: Request, _response: Response, next: NextFunction) {
  if (!request.auth) {
    next(new AppError(401, 'Authentication required.', 'AUTH_REQUIRED'));
    return;
  }

  if (request.auth.role !== 'local-admin') {
    next(new AppError(403, 'Read-only role cannot control screen sessions.', 'SCREEN_CONTROL_FORBIDDEN'));
    return;
  }

  next();
}
