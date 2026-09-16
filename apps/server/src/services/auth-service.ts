import { randomBytes } from 'node:crypto';

import { env } from '../config/env.js';
import type { AuthSession } from '../types/auth.js';
import { AppError } from '../utils/app-error.js';
import { activityService } from './activity-service.js';

class AuthService {
  private sessions = new Map<string, AuthSession>();

  login(username: string, password: string) {
    const isAdmin = username === env.adminUser && password === env.adminPassword;
    const viewerEnabled = Boolean(env.viewerUser && env.viewerPassword);
    const isViewer = viewerEnabled && username === env.viewerUser && password === env.viewerPassword;

    if (!isAdmin && !isViewer) {
      activityService.push({
        source: 'auth',
        level: 'warning',
        message: `Failed login attempt for ${username}.`,
      });
      throw new AppError(401, 'Invalid credentials.', 'INVALID_CREDENTIALS');
    }

    const session: AuthSession = {
      token: randomBytes(24).toString('hex'),
      username,
      role: isAdmin ? 'local-admin' : 'local-viewer',
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    };

    this.sessions.set(session.token, session);
    activityService.push({
      source: 'auth',
      level: 'info',
      message: `${username} authenticated to the local control plane.`,
    });

    return session;
  }

  authenticate(token: string | undefined) {
    if (!token) {
      throw new AppError(401, 'Authentication required.', 'AUTH_REQUIRED');
    }

    const session = this.sessions.get(token);
    if (!session) {
      throw new AppError(401, 'Authentication required.', 'AUTH_REQUIRED');
    }

    session.lastSeenAt = Date.now();
    return session;
  }

  isValid(token: string | undefined) {
    if (!token) {
      return false;
    }

    return this.sessions.has(token);
  }

  logout(token: string | undefined) {
    if (!token) {
      throw new AppError(400, 'A bearer token is required to logout.', 'TOKEN_REQUIRED');
    }

    const session = this.sessions.get(token);
    if (!session) {
      throw new AppError(401, 'Authentication required.', 'AUTH_REQUIRED');
    }

    this.sessions.delete(token);
    activityService.push({
      source: 'auth',
      level: 'info',
      message: `${session.username} terminated the local control-plane session.`,
    });
  }
}

export const authService = new AuthService();
