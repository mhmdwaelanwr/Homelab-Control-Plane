import { apiBase } from '@/lib/env';
import { readToken } from '@/lib/auth';

type RequestOptions = RequestInit & {
  raw?: boolean;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = readToken();
  const headers = new Headers(options.headers ?? {});

  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;
    let errorMessage = fallbackMessage;

    try {
      const payload = (await response.json()) as { message?: string };
      errorMessage = payload.message ?? fallbackMessage;
    } catch {
      // Ignore JSON parse failures and fall back to the status-based message.
    }

    throw new Error(errorMessage);
  }

  if (options.raw) {
    return response as unknown as T;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
