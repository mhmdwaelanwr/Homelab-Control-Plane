export type TerminalShortcutAction = 'none' | 'refresh-metrics' | 'open-network' | 'open-files';

export type TerminalShortcut = {
  id: string;
  label: string;
  command: string;
  description: string;
  action: TerminalShortcutAction;
};

const storageKey = 'dash-terminal-shortcuts-v1';

export function loadTerminalShortcuts() {
  if (typeof window === 'undefined') {
    return [] as TerminalShortcut[];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as TerminalShortcut[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item) => typeof item.id === 'string' && typeof item.label === 'string' && typeof item.command === 'string').slice(0, 24);
  } catch {
    return [];
  }
}

export function saveTerminalShortcuts(items: TerminalShortcut[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(items.slice(0, 24)));
}

export function resolveCommandPlaceholders(command: string, values: Record<string, string>) {
  let resolved = command;
  for (const [key, value] of Object.entries(values)) {
    resolved = resolved.replaceAll(`{{${key}}}`, value);
  }
  return resolved;
}
