export type TerminalCommandProfile = 'read-only' | 'admin';

export interface TerminalExecutionResult {
  command: string;
  profile: TerminalCommandProfile;
  cwd: string;
  shell: string;
  startedAt: number;
  durationMs: number;
  exitCode: number | null;
  timedOut: boolean;
  stdout: string;
  stderr: string;
}

export interface TerminalPreset {
  id: string;
  label: string;
  command: string;
  description: string;
  tags: string[];
}

export interface TerminalPresetsResponse {
  presets: TerminalPreset[];
  hints: string[];
}
