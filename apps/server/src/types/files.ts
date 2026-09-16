export interface FileEntry {
  name: string;
  kind: 'file' | 'directory';
  relativePath: string;
  extension: string;
  size: number;
  modifiedAt: number;
  permissions: string;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
}

export interface FileListResponse {
  rootPath: string;
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  entries: FileEntry[];
  directories: BreadcrumbItem[];
}


