import type { Request, Response } from 'express';

import { terminalService } from '../services/terminal-service.js';
import { asyncHandler } from '../utils/async-handler.js';
import { executeTerminalCommandSchema } from '../validators/terminal.js';
import { AppError } from '../utils/app-error.js';

export const terminalController = {
  execute: asyncHandler(async (request: Request, response: Response) => {
    if (!request.auth) {
      throw new AppError(401, 'Authentication required.', 'AUTH_REQUIRED');
    }

    const payload = executeTerminalCommandSchema.parse(request.body);
    const effectiveProfile = request.auth.role === 'local-viewer' ? 'read-only' : payload.profile;
    const result = await terminalService.execute(payload.command, payload.cwd, request.auth, effectiveProfile);
    response.json(result);
  }),

  presets: asyncHandler(async (_request: Request, response: Response) => {
    response.json(terminalService.getPresets());
  }),
};
