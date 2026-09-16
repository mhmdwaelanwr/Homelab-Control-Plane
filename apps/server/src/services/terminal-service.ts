import { spawn } from 'node:child_process';
import path from 'node:path';

import { env } from '../config/env.js';
import type { AuthSession } from '../types/auth.js';
import type {
  TerminalCommandProfile,
  TerminalExecutionResult,
  TerminalPreset,
  TerminalPresetsResponse,
} from '../types/terminal.js';
import { AppError } from '../utils/app-error.js';
import { activityService } from './activity-service.js';

const STDOUT_LIMIT_BYTES = 64 * 1024;
const STDERR_LIMIT_BYTES = 64 * 1024;

function resolveSafeCwd(inputCwd: string | undefined) {
  const base = path.resolve(env.dashRoot);
  const next = path.resolve(inputCwd ? inputCwd : env.dashRoot);

  if (next !== base && !next.startsWith(`${base}${path.sep}`)) {
    throw new AppError(400, 'The target working directory is outside the managed root.', 'INVALID_WORKING_DIRECTORY');
  }

  return next;
}

function trimOutput(value: string, maxBytes: number) {
  const encoded = Buffer.from(value, 'utf8');
  if (encoded.length <= maxBytes) {
    return value;
  }

  const clipped = encoded.subarray(0, maxBytes).toString('utf8');
  return `${clipped}\n[output clipped]`;
}

function resolveShellCommand(command: string) {
  if (process.platform === 'win32') {
    return {
      shell: 'powershell.exe',
      args: ['-NoProfile', '-Command', command],
    };
  }

  return {
    shell: '/bin/bash',
    args: ['-lc', command],
  };
}

function assertAllowedForProfile(command: string, profile: TerminalCommandProfile) {
  if (profile === 'admin') {
    return;
  }

  const lowered = command.trim().toLowerCase();
  const readOnlyRoots = [
    'ip ',
    'ss ',
    'netstat',
    'systemctl status',
    'systemctl list',
    'uname',
    'uptime',
    'df',
    'free',
    'ps',
    'arp',
    'ping',
    'cat ',
    'tail ',
    'ls',
    'journalctl',
    'who',
  ];

  const dangerousPattern = /(;|&&|\|\||>|<|\brm\b|\bmv\b|\bcp\b|\bchmod\b|\bchown\b|\buser(add|del|mod)\b|\bshutdown\b|\breboot\b|\bmkfs\b|\bdd\b)/i;

  if (dangerousPattern.test(lowered) || !readOnlyRoots.some((root) => lowered.startsWith(root))) {
    throw new AppError(
      403,
      'Command is blocked by read-only profile policy. Switch to admin profile for advanced operations.',
      'TERMINAL_PROFILE_BLOCKED',
    );
  }
}

class TerminalService {
  async execute(
    command: string,
    cwd: string | undefined,
    actor: AuthSession,
    profile: TerminalCommandProfile,
  ): Promise<TerminalExecutionResult> {
    const startedAt = Date.now();
    assertAllowedForProfile(command, profile);
    const safeCwd = resolveSafeCwd(cwd);
    const shellCommand = resolveShellCommand(command);

    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const child = spawn(shellCommand.shell, shellCommand.args, {
        cwd: safeCwd,
        env: process.env,
        windowsHide: true,
      });

      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, env.terminalCommandTimeoutMs);

      child.stdout.on('data', (chunk: Buffer | string) => {
        stdout += chunk.toString();
      });

      child.stderr.on('data', (chunk: Buffer | string) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        clearTimeout(timeoutHandle);
        reject(new AppError(500, error.message, 'TERMINAL_EXECUTION_FAILED'));
      });

      child.on('close', (code) => {
        clearTimeout(timeoutHandle);
        const durationMs = Date.now() - startedAt;
        const clippedStdout = trimOutput(stdout, STDOUT_LIMIT_BYTES);
        const clippedStderr = trimOutput(stderr, STDERR_LIMIT_BYTES);

        activityService.push({
          source: 'terminal',
          level: timedOut || code !== 0 ? 'warning' : 'info',
          message: `${actor.username} ran terminal command: ${command.slice(0, 120)}${command.length > 120 ? '...' : ''}`,
        });

        resolve({
          command,
          profile,
          cwd: safeCwd,
          shell: shellCommand.shell,
          startedAt,
          durationMs,
          exitCode: code,
          timedOut,
          stdout: clippedStdout,
          stderr: clippedStderr,
        });
      });
    });
  }

  getPresets(): TerminalPresetsResponse {
    const presets: TerminalPreset[] = [
      {
        id: 'linux-uptime',
        label: 'Node Uptime',
        command: process.platform === 'win32' ? 'Get-Uptime' : 'uptime',
        description: 'Quick health check for node uptime/load.',
        tags: ['health', 'uptime', 'noc'],
      },
      {
        id: 'network-interfaces',
        label: 'Interfaces',
        command: process.platform === 'win32' ? 'Get-NetIPAddress | Select-Object -First 20' : 'ip -brief address',
        description: 'Inspect active interfaces and addresses.',
        tags: ['ccna', 'interface', 'network'],
      },
      {
        id: 'disk-usage',
        label: 'Disk Usage',
        command: process.platform === 'win32' ? 'Get-PSDrive -PSProvider FileSystem' : 'df -h',
        description: 'Check filesystem utilization quickly.',
        tags: ['storage', 'filesystem', 'linux'],
      },
    ];

    return {
      presets,
      hints: [
        'Use short diagnostic commands for fastest feedback.',
        'Custom commands can include placeholders like {{hostname}} and {{ip}} from the UI.',
        'Prefer read-only checks before destructive operations in production.',
      ],
    };
  }
}

export const terminalService = new TerminalService();
