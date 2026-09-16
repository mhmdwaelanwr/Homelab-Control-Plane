import type { LoginResponse, SessionResponse } from '@/types/api';

import { apiRequest } from './api';

export function login(username: string, password: string) {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function getSession() {
  return apiRequest<SessionResponse>('/auth/me');
}

export function logout() {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    raw: true,
  });
}
