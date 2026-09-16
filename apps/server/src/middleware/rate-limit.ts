import type { Request, Response, NextFunction, RequestHandler } from 'express';

import { AppError } from '../utils/app-error.js';

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
  keySelector?: (request: Request) => string;
};

type HitRecord = {
  count: number;
  resetAt: number;
};

export function createRateLimiter(options: RateLimitOptions): RequestHandler {
  const hits = new Map<string, HitRecord>();

  return (request: Request, _response: Response, next: NextFunction) => {
    const key = options.keySelector?.(request) ?? request.ip ?? request.socket.remoteAddress ?? 'local';
    const now = Date.now();
    const existing = hits.get(key);

    if (!existing || existing.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    existing.count += 1;
    if (existing.count > options.max) {
      next(new AppError(429, options.message, 'RATE_LIMIT_EXCEEDED'));
      return;
    }

    next();
  };
}
