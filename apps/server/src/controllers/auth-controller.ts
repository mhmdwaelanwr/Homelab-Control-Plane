import type { Request, Response } from 'express';

import { extractBearerToken } from '../middleware/auth.js';
import { authService } from '../services/auth-service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { loginSchema } from '../validators/auth.js';

export const authController = {
  login: asyncHandler(async (request: Request, response: Response) => {
    const payload = loginSchema.parse(request.body);
    const session = authService.login(payload.username, payload.password);

    response.json({
      token: session.token,
      user: {
        username: session.username,
        role: session.role,
      },
    });
  }),

  logout: asyncHandler(async (request: Request, response: Response) => {
    authService.logout(extractBearerToken(request));
    response.status(204).send();
  }),

  me: asyncHandler(async (request: Request, response: Response) => {
    const session = request.auth ?? authService.authenticate(extractBearerToken(request));
    response.json({
      authenticated: true,
      user: {
        username: session.username,
        role: session.role,
      },
      session: {
        createdAt: session.createdAt,
        lastSeenAt: session.lastSeenAt,
      },
    });
  }),
};
