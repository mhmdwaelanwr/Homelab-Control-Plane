import { z } from 'zod';

export const mediaStatusQuerySchema = z.object({
  path: z.string().optional().default('/'),
});

export const mediaStreamQuerySchema = z.object({
  path: z.string().min(1),
  token: z.string().optional(),
});

export const startBroadcastSchema = z.object({
  title: z.string().min(1).max(120),
  sourceType: z.enum(['url', 'file']),
  source: z.string().min(1),
  mediaType: z.enum(['audio', 'video']).optional(),
  posterUrl: z.string().url().optional().nullable(),
});