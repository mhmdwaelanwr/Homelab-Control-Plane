import { apiBase } from '@/lib/env';
import { readToken } from '@/lib/auth';
import type { FileListResponse } from '@/types/api';

import { apiRequest } from './api';

export function listFiles(path = '/') {
  const params = new URLSearchParams({ path });
  return apiRequest<FileListResponse>(`/files?${params.toString()}`);
}

export function createFolder(path: string, name: string) {
  return apiRequest<{ message: string }>('/files/folder', {
    method: 'POST',
    body: JSON.stringify({ path, name }),
  });
}

export function renameEntry(path: string, newName: string) {
  return apiRequest<{ message: string }>('/files/rename', {
    method: 'PATCH',
    body: JSON.stringify({ path, newName }),
  });
}

export function deleteEntry(path: string) {
  return apiRequest<{ message: string }>('/files/delete', {
    method: 'DELETE',
    body: JSON.stringify({ path }),
  });
}

export function uploadFile(path: string, file: File) {
  const formData = new FormData();
  formData.append('path', path);
  formData.append('file', file);

  return apiRequest<{ message: string }>('/files/upload', {
    method: 'POST',
    body: formData,
  });
}

export function getDownloadUrl(path: string) {
  const params = new URLSearchParams({ path });
  return `${apiBase}/files/download?${params.toString()}`;
}

export async function downloadFile(path: string) {
  const token = readToken();
  const params = new URLSearchParams({ path });
  const response = await fetch(`${apiBase}/files/download?${params.toString()}`, {
    headers: token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { message?: string } | null;
    throw new Error(payload?.message ?? `Download failed with status ${response.status}`);
  }

  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const contentDisposition = response.headers.get('Content-Disposition');
  const filenameMatch = contentDisposition?.match(/filename="?([^\"]+)"?/i);
  const filename = filenameMatch?.[1] ?? path.split('/').filter(Boolean).at(-1) ?? 'download';

  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
}
