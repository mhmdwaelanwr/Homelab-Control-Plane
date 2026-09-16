import os from 'node:os';
import path from 'node:path';
import { access, readdir, readFile, statfs } from 'node:fs/promises';

import type {
  CpuSnapshot,
  HealthIndicator,
  NetworkSnapshot,
  RamSnapshot,
  StoragePartition,
  StorageSnapshot,
} from '../types/system.js';

type CpuSample = Array<{ idle: number; total: number }>;

let previousCpuSample: CpuSample | null = null;

const ignoredFilesystemTypes = new Set([
  'proc',
  'sysfs',
  'devtmpfs',
  'devpts',
  'tmpfs',
  'cgroup',
  'cgroup2',
  'overlay',
  'squashfs',
  'nsfs',
  'securityfs',
  'pstore',
  'autofs',
  'tracefs',
  'fusectl',
  'mqueue',
  'hugetlbfs',
  'rpc_pipefs',
  'binfmt_misc',
]);

function toPercent(value: number) {
  return Math.max(0, Math.min(100, Number(value.toFixed(1))));
}

function captureCpuSample(): CpuSample {
  return os.cpus().map((core) => {
    const total = Object.values(core.times).reduce((sum, time) => sum + time, 0);
    return { idle: core.times.idle, total };
  });
}

function getCpuUsage() {
  const current = captureCpuSample();

  if (!previousCpuSample) {
    previousCpuSample = current;
    const initialUsage = (os.loadavg()[0] / Math.max(os.cpus().length, 1)) * 100;
    return {
      totalUsage: toPercent(initialUsage),
      perCore: current.map(() => toPercent(initialUsage)),
    };
  }

  const perCore = current.map((sample, index) => {
    const previous = previousCpuSample?.[index];
    if (!previous) {
      return 0;
    }

    const idle = sample.idle - previous.idle;
    const total = sample.total - previous.total;

    if (total <= 0) {
      return 0;
    }

    return toPercent((1 - idle / total) * 100);
  });

  previousCpuSample = current;

  const totalUsage = perCore.length
    ? toPercent(perCore.reduce((sum, value) => sum + value, 0) / perCore.length)
    : 0;

  return { totalUsage, perCore };
}

async function resolveStorageCandidates() {
  if (process.platform === 'linux') {
    const mountInfo = await readTextIfExists('/proc/mounts');
    if (mountInfo) {
      const parsed = mountInfo
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const segments = line.split(' ');
          return {
            mountPoint: decodeMountSegment(segments[1] ?? '/'),
            filesystem: segments[2] ?? 'unknown',
          };
        })
        .filter((entry) => !ignoredFilesystemTypes.has(entry.filesystem));

      const unique = new Map<string, { mountPoint: string; filesystem: string }>();
      for (const entry of parsed) {
        if (!unique.has(entry.mountPoint)) {
          unique.set(entry.mountPoint, entry);
        }
      }

      return Array.from(unique.values());
    }
  }

  const linuxCandidates = ['/', '/home', '/var', '/tmp', '/srv'];
  const windowsCandidates = [path.parse(process.cwd()).root];
  const candidates = process.platform === 'win32' ? windowsCandidates : linuxCandidates;
  const unique = Array.from(new Set(candidates));

  const existing: Array<{ mountPoint: string; filesystem: string }> = [];
  for (const candidate of unique) {
    try {
      await access(candidate);
      existing.push({ mountPoint: candidate, filesystem: 'local' });
    } catch {
      // Skip mount points that do not exist on the current host.
    }
  }

  return existing;
}

async function collectPartitions() {
  const candidates = await resolveStorageCandidates();
  const partitions: StoragePartition[] = [];

  for (const candidate of candidates) {
    try {
      const mountPoint = candidate.mountPoint;
      const stats = await statfs(mountPoint);
      const total = Number(stats.blocks) * Number(stats.bsize);
      const free = Number(stats.bavail) * Number(stats.bsize);
      const used = Math.max(total - free, 0);

      partitions.push({
        name: mountPoint === '/' ? 'rootfs' : path.basename(mountPoint) || mountPoint,
        mountPoint,
        filesystem: candidate.filesystem,
        total,
        used,
        free,
        usagePercent: total > 0 ? toPercent((used / total) * 100) : 0,
      });
    } catch {
      // Skip mount points that cannot be sampled safely.
    }
  }

  return partitions;
}

async function readTextIfExists(filePath: string) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

function decodeMountSegment(value: string) {
  return value.replace(/\\040/g, ' ');
}

function parseMeminfo(text: string | null) {
  if (!text) {
    return new Map<string, number>();
  }

  const values = new Map<string, number>();
  for (const line of text.split('\n')) {
    const match = /^([^:]+):\s+(\d+)/.exec(line.trim());
    if (match) {
      values.set(match[1], Number(match[2]) * 1024);
    }
  }

  return values;
}

async function readCpuTemperature() {
  if (process.platform !== 'linux') {
    return null;
  }

  try {
    const entries = await readdir('/sys/class/thermal');
    for (const entry of entries.filter((value) => value.startsWith('thermal_zone'))) {
      const temperatureText = await readTextIfExists(`/sys/class/thermal/${entry}/temp`);
      if (!temperatureText) {
        continue;
      }

      const value = Number.parseInt(temperatureText.trim(), 10);
      if (Number.isFinite(value) && value > 0) {
        return Number((value / 1000).toFixed(1));
      }
    }
  } catch {
    return null;
  }

  return null;
}

export async function collectCpuSnapshot(history: CpuSnapshot['history']): Promise<CpuSnapshot> {
  const { totalUsage, perCore } = getCpuUsage();
  const cpus = os.cpus();

  return {
    totalUsage,
    perCore,
    loadAverage: os.loadavg() as [number, number, number],
    frequencyMHz: cpus[0]?.speed ?? null,
    temperatureC: await readCpuTemperature(),
    history,
  };
}

export async function collectRamSnapshot(history: RamSnapshot['history']): Promise<RamSnapshot> {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;
  const meminfo = parseMeminfo(process.platform === 'linux' ? await readTextIfExists('/proc/meminfo') : null);
  const swapTotal = meminfo.get('SwapTotal') ?? null;
  const swapFree = meminfo.get('SwapFree') ?? null;
  const swapUsed = swapTotal !== null && swapFree !== null ? Math.max(swapTotal - swapFree, 0) : null;

  return {
    total,
    used,
    free,
    buffers: meminfo.get('Buffers') ?? null,
    cache: meminfo.get('Cached') ?? null,
    swap: {
      total: swapTotal,
      used: swapUsed,
      free: swapFree,
    },
    usagePercent: total > 0 ? toPercent((used / total) * 100) : 0,
    history,
  };
}

export async function collectStorageSnapshot(history: StorageSnapshot['history']): Promise<StorageSnapshot> {
  const partitions = await collectPartitions();
  const total = partitions.reduce((sum, partition) => sum + partition.total, 0);
  const used = partitions.reduce((sum, partition) => sum + partition.used, 0);
  const free = partitions.reduce((sum, partition) => sum + partition.free, 0);

  return {
    total,
    used,
    free,
    partitions,
    history,
  };
}

export function collectNetworkSnapshot(): NetworkSnapshot {
  const interfaces = os.networkInterfaces();
  const addresses: NetworkSnapshot['interfaces'] = [];

  for (const [name, values] of Object.entries(interfaces)) {
    for (const value of values ?? []) {
      if (value.family === 'IPv4' && !value.internal) {
        addresses.push({ name, address: value.address });
      }
    }
  }

  return {
    hostname: os.hostname(),
    currentUser: os.userInfo().username,
    localIp: addresses[0]?.address ?? '127.0.0.1',
    interfaces: addresses,
  };
}

export function buildHealth(cpu: CpuSnapshot, ram: RamSnapshot, storage: StorageSnapshot): HealthIndicator[] {
  const signals = [
    {
      label: 'CPU saturation',
      value: cpu.totalUsage,
      warning: 70,
      critical: 90,
      description: `Total processor load at ${cpu.totalUsage}%`,
    },
    {
      label: 'Memory pressure',
      value: ram.usagePercent,
      warning: 75,
      critical: 90,
      description: `RAM utilization at ${ram.usagePercent}%`,
    },
    {
      label: 'Storage pressure',
      value: storage.total > 0 ? toPercent((storage.used / storage.total) * 100) : 0,
      warning: 80,
      critical: 92,
      description: `Disk utilization at ${storage.total > 0 ? toPercent((storage.used / storage.total) * 100) : 0}%`,
    },
  ];

  return signals.map((signal) => ({
    label: signal.label,
    status:
      signal.value >= signal.critical ? 'critical' : signal.value >= signal.warning ? 'warning' : 'healthy',
    description: signal.description,
  }));
}
