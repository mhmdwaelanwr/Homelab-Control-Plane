import { z } from 'zod';

export const executeTerminalCommandSchema = z.object({
  command: z.string().trim().min(1, 'Command is required.').max(400, 'Command is too long.'),
  cwd: z.string().trim().min(1).max(500).optional(),
  profile: z.enum(['read-only', 'admin']).default('admin'),
});
