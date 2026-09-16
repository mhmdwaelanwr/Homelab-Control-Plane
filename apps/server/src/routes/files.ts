import { Router } from 'express';
import multer from 'multer';

import { env } from '../config/env.js';
import { filesController } from '../controllers/files-controller.js';
import { requireAuth } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rate-limit.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxUploadBytes,
  },
});

export const filesRouter = Router();

filesRouter.use(requireAuth);

filesRouter.get('/', filesController.list);
filesRouter.post('/upload', createRateLimiter({ windowMs: 60_000, max: 30, message: 'Upload rate exceeded.' }), upload.single('file'), filesController.upload);
filesRouter.post('/folder', createRateLimiter({ windowMs: 60_000, max: 20, message: 'Folder creation rate exceeded.' }), filesController.createFolder);
filesRouter.patch('/rename', createRateLimiter({ windowMs: 60_000, max: 20, message: 'Rename rate exceeded.' }), filesController.rename);
filesRouter.delete('/delete', createRateLimiter({ windowMs: 60_000, max: 12, message: 'Delete rate exceeded.' }), filesController.remove);
filesRouter.get('/download', filesController.download);
