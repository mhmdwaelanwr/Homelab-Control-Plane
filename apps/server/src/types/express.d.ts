import type { AuthSession } from './auth.js';

declare global {
  namespace Express {
    interface Request {
      auth?: AuthSession;
      file?: Multer.File;
    }
  }
}

export {};
