import path from 'node:path';
import { promises as fs } from 'node:fs';

import { AppError } from './app-error.js';

export function permissionsFromMode(mode: number) {
  return `0${(mode & 0o777).toString(8)}`;
}

export function normalizeClientPath(input = '/') {
  const trimmed = input.trim();
  if (!trimmed || trimmed === '/' || trimmed === '.') {
    return '';
  }

  return trimmed.replace(/^\/+/, '').replace(/\\/g, '/');
}

export function assertSafeEntryName(input: string) {
  const value = input.trim();
  if (!value) {
    throw new AppError(400, 'A file or folder name is required.', 'INVALID_ENTRY_NAME');
  }

  if (value === '.' || value === '..' || value.includes('/') || value.includes('\\')) {
    throw new AppError(400, 'Entry names cannot contain path separators.', 'INVALID_ENTRY_NAME');
  }

  return value;
}

function assertWithinRoot(rootPath: string, candidatePath: string) {
  const relative = path.relative(rootPath, candidatePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new AppError(403, 'Path escapes the configured root.', 'PATH_OUTSIDE_ROOT');
  }
}

async function realpathOrFallback(candidatePath: string) {
  try {
    return await fs.realpath(candidatePath);
  } catch {
    return candidatePath;
  }
}

export async function resolveManagedPath(
  rootPath: string,
  relativeInput = '/',
  options: { mustExist: boolean },
) {
  const normalized = normalizeClientPath(relativeInput);
  const absolute = path.resolve(rootPath, normalized);
  const lexicalRelative = path.relative(rootPath, absolute);

  if (lexicalRelative.startsWith('..') || path.isAbsolute(lexicalRelative)) {
    throw new AppError(403, 'Path escapes the configured root.', 'PATH_OUTSIDE_ROOT');
  }

  const rootRealPath = await realpathOrFallback(rootPath);

  if (options.mustExist) {
    try {
      const targetRealPath = await fs.realpath(absolute);
      assertWithinRoot(rootRealPath, targetRealPath);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(404, 'Target path was not found.', 'PATH_NOT_FOUND');
    }
  } else {
    const parentPath = path.dirname(absolute);
    try {
      const parentRealPath = await fs.realpath(parentPath);
      assertWithinRoot(rootRealPath, parentRealPath);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(404, 'Parent path was not found.', 'PARENT_PATH_NOT_FOUND');
    }
  }

  return {
    absolute,
    relativePath: normalized ? `/${normalized}` : '/',
  };
}

export function buildBreadcrumbs(relativePath: string) {
  if (relativePath === '/') {
    return [{ label: 'root', path: '/' }];
  }

  const parts = relativePath.replace(/^\//, '').split('/').filter(Boolean);
  return [
    { label: 'root', path: '/' },
    ...parts.map((part, index) => ({
      label: part,
      path: `/${parts.slice(0, index + 1).join('/')}`,
    })),
  ];
}
