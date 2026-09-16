import http from 'node:http';

import cors from 'cors';
import express from 'express';

import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.js';
import { filesRouter } from './routes/files.js';
import { mediaRouter } from './routes/media.js';
import { screenRouter } from './routes/screen.js';
import { systemRouter } from './routes/system.js';
import { terminalRouter } from './routes/terminal.js';
import { dockerRouter } from './routes/docker.js';
import { metricsSocketManager } from './websocket/metrics-socket.js';
import { terminalSocketManager } from './websocket/terminal-socket.js';

const app = express();

app.disable('x-powered-by');

const configuredCorsOrigins = env.corsOrigin
  .split(',')
  .map((origin) => origin.trim().toLowerCase())
  .filter(Boolean);

const allowedCorsOrigins = new Set(configuredCorsOrigins);

function isAllowedOrigin(origin?: string): boolean {
  if (!origin) {
    return true;
  }

  const normalizedOrigin = origin.toLowerCase();
  if (allowedCorsOrigins.has(normalizedOrigin)) {
    return true;
  }

  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin ?? 'unknown'}`));
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'linux-dashboard-api', mode: 'local-admin' });
});

app.use('/api/auth', authRouter);
app.use('/api/system', systemRouter);
app.use('/api/files', filesRouter);
app.use('/api/media', mediaRouter);
app.use('/api/screen', screenRouter);
app.use('/api/terminal', terminalRouter);
app.use('/api/docker', dockerRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = http.createServer(app);

metricsSocketManager.attach(server);
terminalSocketManager.attach(server);

server.listen(env.port, () => {
  console.log(`linux-dashboard-api listening on http://localhost:${env.port}`);
});
