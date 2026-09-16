import path from 'node:path';
import { promises as fs } from 'node:fs';
import type { Express } from 'express';

import { activityService } from './activity-service.js';
import type { FileEntry, FileListResponse } from '../types/files.js';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';
import {
  assertSafeEntryName,
  buildBreadcrumbs,
  permissionsFromMode,
  resolveManagedPath,
} from '../utils/path-utils.js';

class FileService {
  readonly rootPath = env.dashRoot;

  async list(relativeInput = '/'): Promise<FileListResponse> {
    const location = await resolveManagedPath(this.rootPath, relativeInput, { mustExist: true });
    const entries = await fs.readdir(location.absolute, { withFileTypes: true });

    const mappedEntries = await Promise.allSettled(
      entries.map(async (entry) => {
        const absolutePath = path.join(location.absolute, entry.name);
        const stats = await fs.lstat(absolutePath);
        const kind = stats.isDirectory() ? 'directory' : 'file';
        const clientPath = `${location.relativePath === '/' ? '' : location.relativePath}/${entry.name}`;

        const fileEntry: FileEntry = {
          name: entry.name,
          kind,
          relativePath: clientPath || '/',
          extension: kind === 'file' ? path.extname(entry.name).replace('.', '') : 'dir',
          size: kind === 'file' ? stats.size : 0,
          modifiedAt: stats.mtimeMs,
          permissions: permissionsFromMode(stats.mode),
        };

        return fileEntry;
      }),
    ).then((results) =>
      results
        .filter((result): result is PromiseFulfilledResult<FileEntry> => result.status === 'fulfilled')
        .map((result) => result.value)
        .sort((left, right) => {
          if (left.kind !== right.kind) {
            return left.kind === 'directory' ? -1 : 1;
          }

          return left.name.localeCompare(right.name);
        }),
    );

    const directories = mappedEntries
      .filter((entry) => entry.kind === 'directory')
      .map((entry) => ({ label: entry.name, path: entry.relativePath }));

    return {
      rootPath: this.rootPath,
      currentPath: location.relativePath,
      breadcrumbs: buildBreadcrumbs(location.relativePath),
      entries: mappedEntries,
      directories,
    };
  }

  async createFolder(parentPath: string, folderName: string) {
    const sanitizedName = assertSafeEntryName(folderName);
    const location = await resolveManagedPath(this.rootPath, parentPath, { mustExist: true });
    const target = path.join(location.absolute, sanitizedName);
    await fs.mkdir(target, { recursive: false });

    activityService.push({
      source: 'files',
      level: 'info',
      message: `Created folder ${path.posix.join(location.relativePath, sanitizedName)}.`,
    });
  }

  async rename(targetPath: string, newName: string) {
    const sanitizedName = assertSafeEntryName(newName);
    const location = await resolveManagedPath(this.rootPath, targetPath, { mustExist: true });
    if (location.relativePath === '/') {
      throw new AppError(400, 'The configured root cannot be renamed.', 'ROOT_RENAME_FORBIDDEN');
    }

    const nextAbsolute = path.join(path.dirname(location.absolute), sanitizedName);
    await fs.rename(location.absolute, nextAbsolute);

    activityService.push({
      source: 'files',
      level: 'info',
      message: `Renamed ${location.relativePath} to ${sanitizedName}.`,
    });
  }

  async remove(targetPath: string) {
    const location = await resolveManagedPath(this.rootPath, targetPath, { mustExist: true });
    if (location.relativePath === '/') {
      throw new AppError(400, 'Refusing to delete the configured root.', 'ROOT_DELETE_FORBIDDEN');
    }

    await fs.rm(location.absolute, { recursive: true, force: false });
    activityService.push({
      source: 'files',
      level: 'warning',
      message: `Deleted ${location.relativePath}.`,
    });
  }

  async saveUploadedFile(parentPath: string, file: Express.Multer.File) {
    const location = await resolveManagedPath(this.rootPath, parentPath, { mustExist: true });
    const target = path.join(location.absolute, assertSafeEntryName(file.originalname));
    await fs.writeFile(target, file.buffer);

    activityService.push({
      source: 'files',
      level: 'info',
      message: `Uploaded ${file.originalname} into ${location.relativePath}.`,
    });
  }

  async resolveDownload(targetPath: string) {
    const location = await resolveManagedPath(this.rootPath, targetPath, { mustExist: true });
    const stats = await fs.stat(location.absolute);

    if (stats.isDirectory()) {
      throw new AppError(400, 'Directories cannot be downloaded as a single file.', 'DIRECTORY_DOWNLOAD_UNSUPPORTED');
    }

    return location;
  }
}

export const fileService = new FileService();
