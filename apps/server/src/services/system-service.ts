import os from 'node:os';
import { spawn } from 'node:child_process';

import { env } from '../config/env.js';
import {
  buildHealth,
  collectCpuSnapshot,
  collectNetworkSnapshot,
  collectRamSnapshot,
  collectStorageSnapshot,
} from '../adapters/system-adapter.js';
import { activityService } from './activity-service.js';
import type {
  BusinessSnapshot,
  BusiestPartitionSummary,
  MetricPoint,
  OperationalInsights,
  OperationalRecommendation,
  RealtimePayload,
  ResourceFocus,
  ConnectedDevicesSnapshot,
  ConnectedDevice,
} from '../types/system.js';

function pushPoint(history: MetricPoint[], value: number) {
  history.push({ timestamp: Date.now(), value });
  if (history.length > 30) {
    history.shift();
  }
}

function createRecommendation(
  id: string,
  severity: OperationalRecommendation['severity'],
  title: string,
  description: string,
): OperationalRecommendation {
  return { id, severity, title, description };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, precision = 2) {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function runCommand(command: string, args: string[], timeoutMs = 4000) {
  return new Promise<{ stdout: string; stderr: string; code: number | null }>((resolve) => {
    const child = spawn(command, args, { windowsHide: true });
    let stdout = '';
    let stderr = '';

    const timeout = setTimeout(() => {
      child.kill();
      resolve({ stdout, stderr, code: null });
    }, timeoutMs);

    child.stdout.on('data', (chunk: Buffer | string) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer | string) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      resolve({ stdout, stderr, code });
    });

    child.on('error', () => {
      clearTimeout(timeout);
      resolve({ stdout, stderr: 'failed to execute command', code: null });
    });
  });
}

function parseLinuxNeighbors(output: string): ConnectedDevice[] {
  const lines = output.split('\n').map((line) => line.trim()).filter(Boolean);
  const devices: ConnectedDevice[] = [];

  for (const line of lines) {
    const match = /^(\d{1,3}(?:\.\d{1,3}){3})\s+dev\s+(\S+)(?:\s+lladdr\s+([0-9a-f:]{17}))?\s*(\S+)?/i.exec(line);
    if (!match) {
      continue;
    }

    devices.push({
      ip: match[1],
      iface: match[2] ?? null,
      mac: match[3] ?? null,
      state: match[4] ?? null,
      source: 'neigh',
    });
  }

  return devices;
}

function parseArpOutput(output: string): ConnectedDevice[] {
  const lines = output.split('\n').map((line) => line.trim()).filter(Boolean);
  const devices: ConnectedDevice[] = [];
  let currentInterface: string | null = null;

  for (const line of lines) {
    const ifaceHeader = /^Interface:\s+([0-9.]+)\s+---/i.exec(line);
    if (ifaceHeader) {
      currentInterface = ifaceHeader[1] ?? null;
      continue;
    }

    const winRow = /^(\d{1,3}(?:\.\d{1,3}){3})\s+([0-9a-f-]{17})\s+(\w+)/i.exec(line);
    if (winRow) {
      devices.push({
        ip: winRow[1],
        mac: winRow[2].replace(/-/g, ':'),
        iface: currentInterface,
        state: winRow[3]?.toLowerCase() ?? null,
        source: 'arp',
      });
      continue;
    }

    const linuxRow = /^\(?([0-9.]+)\)?\s+at\s+([0-9a-f:]{17}|<incomplete>)\s+.*\s+on\s+(\S+)/i.exec(line);
    if (linuxRow) {
      devices.push({
        ip: linuxRow[1],
        mac: linuxRow[2] === '<incomplete>' ? null : linuxRow[2],
        iface: linuxRow[3] ?? null,
        state: linuxRow[2] === '<incomplete>' ? 'incomplete' : 'reachable',
        source: 'arp',
      });
    }
  }

  return devices;
}

function dedupeDevices(devices: ConnectedDevice[]) {
  const map = new Map<string, ConnectedDevice>();
  for (const device of devices) {
    const key = `${device.ip}-${device.mac ?? 'na'}-${device.iface ?? 'na'}`;
    if (!map.has(key)) {
      map.set(key, device);
    }
  }
  return [...map.values()].slice(0, 120);
}

function buildFocus(cpuUsage: number, ramUsage: number, storageUsage: number): ResourceFocus {
  const candidates: ResourceFocus[] = [
    {
      resource: 'CPU',
      status: cpuUsage >= 90 ? 'critical' : cpuUsage >= 70 ? 'warning' : 'healthy',
      value: cpuUsage,
      note:
        cpuUsage >= 90
          ? 'Compute headroom is nearly saturated. Delay heavy jobs or scale down concurrent tasks.'
          : cpuUsage >= 70
            ? 'Processor pressure is elevated. Watch burst workloads and background jobs.'
            : 'Processor headroom is stable for interactive and background work.',
    },
    {
      resource: 'Memory',
      status: ramUsage >= 90 ? 'critical' : ramUsage >= 75 ? 'warning' : 'healthy',
      value: ramUsage,
      note:
        ramUsage >= 90
          ? 'Memory pressure is severe. Expect swap churn if new services start.'
          : ramUsage >= 75
            ? 'Memory pressure is rising. Review caches and long-running processes.'
            : 'Memory headroom remains comfortable for current demand.',
    },
    {
      resource: 'Storage',
      status: storageUsage >= 92 ? 'critical' : storageUsage >= 80 ? 'warning' : 'healthy',
      value: storageUsage,
      note:
        storageUsage >= 92
          ? 'Disk capacity is in a critical zone. Free space before write-heavy tasks continue.'
          : storageUsage >= 80
            ? 'Disk utilization is climbing. Archive cold data or extend capacity soon.'
            : 'Disk capacity is balanced and operating within the target window.',
    },
  ];

  return [...candidates].sort((left, right) => right.value - left.value)[0] ?? candidates[0];
}

function buildRecommendations(args: {
  cpuUsage: number;
  ramUsage: number;
  focus: ResourceFocus;
  busiestPartition: BusiestPartitionSummary | null;
  interfaces: number;
}): OperationalRecommendation[] {
  const recommendations: OperationalRecommendation[] = [];

  if (args.cpuUsage >= 80) {
    recommendations.push(
      createRecommendation(
        'cpu-pressure',
        args.cpuUsage >= 92 ? 'critical' : 'warning',
        'Review compute pressure',
        `CPU is averaging ${args.cpuUsage.toFixed(1)}%. Inspect scheduled jobs or runaway processes before latency grows.`,
      ),
    );
  }

  if (args.ramUsage >= 75) {
    recommendations.push(
      createRecommendation(
        'memory-pressure',
        args.ramUsage >= 90 ? 'critical' : 'warning',
        'Reduce memory pressure',
        `RAM usage is ${args.ramUsage.toFixed(1)}%. Reclaim caches or verify that swap activity stays low.`,
      ),
    );
  }

  if (args.busiestPartition && args.busiestPartition.usagePercent >= 80) {
    recommendations.push(
      createRecommendation(
        'storage-pressure',
        args.busiestPartition.usagePercent >= 92 ? 'critical' : 'warning',
        'Clear disk headroom',
        `${args.busiestPartition.mountPoint} is ${args.busiestPartition.usagePercent.toFixed(1)}% full. Archive logs or move cold assets.`,
      ),
    );
  }

  if (args.interfaces > 1) {
    recommendations.push(
      createRecommendation(
        'network-surface',
        'healthy',
        'Network surface looks healthy',
        `Detected ${args.interfaces} active interfaces. Keep management traffic pinned to the primary address for cleaner operations.`,
      ),
    );
  }

  recommendations.push(
    createRecommendation(
      'focus-area',
      args.focus.status,
      `${args.focus.resource} is the primary watchpoint`,
      args.focus.note,
    ),
  );

  return recommendations.slice(0, 4);
}

function findBusiestPartition(partitions: RealtimePayload['storage']['partitions']): BusiestPartitionSummary | null {
  const partition = [...partitions].sort((left, right) => right.usagePercent - left.usagePercent)[0];

  if (!partition) {
    return null;
  }

  return {
    name: partition.name,
    mountPoint: partition.mountPoint,
    usagePercent: partition.usagePercent,
    free: partition.free,
  };
}

function buildInsights(args: {
  systemStatus: RealtimePayload['overview']['systemStatus'];
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
  partitions: RealtimePayload['storage']['partitions'];
  interfaces: number;
}): OperationalInsights {
  const focus = buildFocus(args.cpuUsage, args.ramUsage, args.storageUsage);
  const busiestPartition = findBusiestPartition(args.partitions);

  const recommendations = buildRecommendations({
    cpuUsage: args.cpuUsage,
    ramUsage: args.ramUsage,
    focus,
    busiestPartition,
    interfaces: args.interfaces,
  });

  return {
    headline:
      args.systemStatus === 'healthy'
        ? 'Fleet posture is steady'
        : args.systemStatus === 'warning'
          ? 'Operator attention is recommended'
          : 'Immediate operator action is required',
    summary:
      busiestPartition && busiestPartition.usagePercent >= 80
        ? `${focus.resource} is the top watchpoint while ${busiestPartition.mountPoint} carries the heaviest disk pressure.`
        : `${focus.resource} is currently the main watchpoint with overall posture remaining ${args.systemStatus}.`,
    posture: args.systemStatus,
    focus,
    busiestPartition,
    recommendations,
  };
}

function buildBusinessSnapshot(args: {
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
  health: RealtimePayload['overview']['health'];
  interfaces: number;
}): BusinessSnapshot {
  const criticalCount = args.health.filter((item) => item.status === 'critical').length;
  const warningCount = args.health.filter((item) => item.status === 'warning').length;

  const activeCustomers = Math.max(24, args.interfaces * 8 + Math.round((100 - args.cpuUsage) / 6));
  const trialCustomers = Math.max(6, Math.round(activeCustomers * 0.22));

  const arpa = round(clamp(72 + (100 - args.storageUsage) * 0.45 + args.interfaces * 1.8, 69, 139), 2);
  const expansionRevenue = round(clamp(1400 + (100 - args.ramUsage) * 36 + (100 - args.cpuUsage) * 24, 1200, 8400), 2);
  const mrr = round(activeCustomers * arpa + expansionRevenue, 2);
  const arr = round(mrr * 12, 2);

  const churnRate = round(
    clamp(1.2 + criticalCount * 0.9 + warningCount * 0.35 + Math.max(args.cpuUsage - 72, 0) * 0.02, 0.8, 8.9),
    2,
  );
  const nrr = round(clamp(108.5 - churnRate * 2.4 + (expansionRevenue / Math.max(mrr, 1)) * 42, 90, 132), 2);
  const cacPaybackMonths = round(clamp(8.4 + churnRate * 0.45 - (nrr - 100) * 0.09, 3.4, 15.5), 1);

  return {
    mrr,
    arr,
    arpa,
    churnRate,
    nrr,
    activeCustomers,
    trialCustomers,
    expansionRevenue,
    cacPaybackMonths,
  };
}

class SystemService {
  private cpuHistory: MetricPoint[] = [];

  private ramHistory: MetricPoint[] = [];

  private storageHistory: MetricPoint[] = [];

  private cache: RealtimePayload | null = null;

  private lastStatus: RealtimePayload['overview']['systemStatus'] | null = null;

  private lastRefreshAt = 0;

  private refreshPromise: Promise<RealtimePayload> | null = null;

  async refresh() {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.collect();

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async collect() {
    const cpu = await collectCpuSnapshot([...this.cpuHistory]);
    const ram = await collectRamSnapshot([...this.ramHistory]);
    const storage = await collectStorageSnapshot([...this.storageHistory]);
    const network = collectNetworkSnapshot();

    pushPoint(this.cpuHistory, cpu.totalUsage);
    pushPoint(this.ramHistory, ram.usagePercent);
    const storageUsage = storage.total > 0 ? Number(((storage.used / storage.total) * 100).toFixed(1)) : 0;
    pushPoint(this.storageHistory, storageUsage);

    const nextCpu = await collectCpuSnapshot([...this.cpuHistory]);
    const nextRam = await collectRamSnapshot([...this.ramHistory]);
    const nextStorage = {
      ...storage,
      history: [...this.storageHistory],
    };
    const health = buildHealth(nextCpu, nextRam, nextStorage);
    const systemStatus = health.some((item) => item.status === 'critical')
      ? 'critical'
      : health.some((item) => item.status === 'warning')
        ? 'warning'
        : 'healthy';
    const insights = buildInsights({
      systemStatus,
      cpuUsage: nextCpu.totalUsage,
      ramUsage: nextRam.usagePercent,
      storageUsage,
      partitions: nextStorage.partitions,
      interfaces: network.interfaces.length,
    });
    const business = buildBusinessSnapshot({
      cpuUsage: nextCpu.totalUsage,
      ramUsage: nextRam.usagePercent,
      storageUsage,
      health,
      interfaces: network.interfaces.length,
    });

    if (this.lastStatus && this.lastStatus !== systemStatus) {
      activityService.push({
        source: 'system',
        level: systemStatus === 'healthy' ? 'info' : systemStatus,
        message: `System status changed from ${this.lastStatus} to ${systemStatus}.`,
      });
    }

    this.lastStatus = systemStatus;
    this.lastRefreshAt = Date.now();
    const payload: RealtimePayload = {
      overview: {
        uptimeSeconds: os.uptime(),
        hostname: network.hostname,
        currentUser: network.currentUser,
        localIp: network.localIp,
        systemStatus,
        cpuUsage: nextCpu.totalUsage,
        ramUsage: nextRam.usagePercent,
        storageUsage,
        health,
        recentActivity: activityService.recent(),
      },
      cpu: nextCpu,
      ram: nextRam,
      storage: nextStorage,
      network,
      insights,
      business,
    };

    this.cache = payload;

    return payload;
  }

  async getPayload(forceFresh = false) {
    if (forceFresh || !this.cache || Date.now() - this.lastRefreshAt >= env.metricsBroadcastMs) {
      return this.refresh();
    }

    return this.cache;
  }

  async getOverview() {
    const payload = await this.getPayload();
    return payload.overview;
  }

  async getCpu() {
    const payload = await this.getPayload();
    return payload.cpu;
  }

  async getRam() {
    const payload = await this.getPayload();
    return payload.ram;
  }

  async getStorage() {
    const payload = await this.getPayload();
    return payload.storage;
  }

  async getNetwork() {
    const payload = await this.getPayload();
    return payload.network;
  }

  async getConnectedDevices(): Promise<ConnectedDevicesSnapshot> {
    const commands =
      process.platform === 'linux'
        ? [
            { command: 'ip', args: ['neigh'], parser: parseLinuxNeighbors },
            { command: 'arp', args: ['-an'], parser: parseArpOutput },
          ]
        : [{ command: 'arp', args: ['-a'], parser: parseArpOutput }];

    const all: ConnectedDevice[] = [];

    for (const item of commands) {
      const result = await runCommand(item.command, item.args);
      if (result.stdout.trim()) {
        all.push(...item.parser(result.stdout));
      }
    }

    return {
      scannedAt: Date.now(),
      devices: dedupeDevices(all),
    };
  }

  async getInsights() {
    const payload = await this.getPayload();
    return payload.insights;
  }

  async getBusiness() {
    const payload = await this.getPayload();
    return payload.business;
  }
}

export const systemService = new SystemService();
