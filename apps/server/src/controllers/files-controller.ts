import path from 'node:path';

import type { Request, Response } from 'express';
import mime from 'mime-types';

import { fileService } from '../services/file-service.js';
import { asyncHandler } from '../utils/async-handler.js';
import {
  createFolderSchema,
  deleteEntrySchema,
  downloadQuerySchema,
  listFilesQuerySchema,
  renameEntrySchema,
} from '../validators/files.js';
import { AppError } from '../utils/app-error.js';

export const filesController = {
  list: asyncHandler(async (request: Request, response: Response) => {
    const query = listFilesQuerySchema.parse(request.query);
    response.json(await fileService.list(query.path));
  }),

  upload: asyncHandler(async (request: Request, response: Response) => {
    if (!request.file) {
      throw new AppError(400, 'A file upload is required.', 'FILE_REQUIRED');
    }

    const targetPath = typeof request.body.path === 'string' ? request.body.path : '/';
    await fileService.saveUploadedFile(targetPath, request.file);
    response.status(201).json({ message: 'Upload complete.' });
  }),

  createFolder: asyncHandler(async (request: Request, response: Response) => {
    const payload = createFolderSchema.parse(request.body);
    await fileService.createFolder(payload.path, payload.name);
    response.status(201).json({ message: 'Folder created.' });
  }),

  rename: asyncHandler(async (request: Request, response: Response) => {
    const payload = renameEntrySchema.parse(request.body);
    await fileService.rename(payload.path, payload.newName);
    response.json({ message: 'Entry renamed.' });
  }),

  remove: asyncHandler(async (request: Request, response: Response) => {
    const payload = deleteEntrySchema.parse(request.body);
    await fileService.remove(payload.path);
    response.json({ message: 'Entry deleted.' });
  }),

  download: asyncHandler(async (request: Request, response: Response) => {
    const query = downloadQuerySchema.parse(request.query);
    const location = await fileService.resolveDownload(query.path);
    const contentType = mime.lookup(location.absolute) || 'application/octet-stream';
    const filename = path.basename(location.absolute);

    response.download(location.absolute, filename, {
      headers: {
        'Content-Type': contentType,
      },
    });
  }),
};
