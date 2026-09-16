import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0.0%';
  }

  return `${value.toFixed(1)}%`;
}

export function formatBytes(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return resolveUiLocale() === 'ar' ? 'غير متاح' : 'Unavailable';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 ? 0 : 1)} ${units[unitIndex]}`;
}

export function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  return `${days}d ${hours}h ${minutes}m`;
}

function resolveUiLocale() {
  if (typeof document === 'undefined') {
    return 'en';
  }

  return document.documentElement.lang || 'en';
}

export function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(resolveUiLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(timestamp);
}

export function formatRelativeTime(timestamp: number) {
  const diff = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(resolveUiLocale(), { numeric: 'auto' });

  if (Math.abs(diff) < 60) {
    return formatter.format(diff, 'second');
  }

  if (Math.abs(diff) < 3600) {
    return formatter.format(Math.round(diff / 60), 'minute');
  }

  if (Math.abs(diff) < 86400) {
    return formatter.format(Math.round(diff / 3600), 'hour');
  }

  return formatter.format(Math.round(diff / 86400), 'day');
}

export async function copyToClipboard(value: string) {
  await navigator.clipboard.writeText(value);
}
