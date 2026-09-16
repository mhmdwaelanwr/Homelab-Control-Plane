import { z } from 'zod';

export const listFilesQuerySchema = z.object({
  path: z.string().optional().default('/'),
});

export const createFolderSchema = z.object({
  path: z.string().default('/'),
  name: z.string().min(1),
});

export const renameEntrySchema = z.object({
  path: z.string().min(1),
  newName: z.string().min(1),
});

export const deleteEntrySchema = z.object({
  path: z.string().min(1),
});

export const downloadQuerySchema = z.object({
  path: z.string().min(1),
});
