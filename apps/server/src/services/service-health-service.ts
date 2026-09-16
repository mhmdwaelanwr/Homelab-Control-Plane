import type { ServiceHealthItem, ServiceHealthSnapshot } from '../types/system.js';

type ProbeTarget = {
  id: string;
  name: string;
  category: ServiceHealthItem['category'];
  url: string;
};

const probeTargets: ProbeTarget[] = [
  {
    id: 'plex',
    name: 'Plex',
    category: 'media',
    url: process.env.PLEX_URL ?? 'http://localhost:32400/identity',
  },
  {
    id: 'home-assistant',
    name: 'Home Assistant',
    category: 'automation',
    url: process.env.HOME_ASSISTANT_URL ?? 'http://localhost:8123/',
  },
  {
    id: 'pihole',
    name: 'Pi-hole',
    category: 'network',
    url: process.env.PIHOLE_URL ?? 'http://localhost/admin/',
  },
  {
    id: 'grafana',
    name: 'Grafana',
    category: 'observability',
    url: process.env.GRAFANA_URL ?? 'http://localhost:3000/api/health',
  },
  {
    id: 'portainer',
    name: 'Portainer',
    category: 'containers',
    url: process.env.PORTAINER_URL ?? 'http://localhost:9000/api/status',
  },
];

function classifyStatus(statusCode: number | null, error: boolean): ServiceHealthItem['status'] {
  if (error || statusCode === null) {
    return 'critical';
  }

  if (statusCode >= 500) {
    return 'critical';
  }

  if (statusCode >= 400) {
    return 'warning';
  }

  return 'healthy';
}

function resolveMessage(status: ServiceHealthItem['status'], statusCode: number | null, error: string | null): string {
  if (error) {
    return error;
  }

  if (statusCode === null) {
    return 'No response code';
  }

  if (status === 'healthy') {
    return `Service is reachable (${statusCode}).`;
  }

  if (status === 'warning') {
    return `Service returned client error (${statusCode}).`;
  }

  return `Service returned server error (${statusCode}).`;
}

async function probeTarget(target: ProbeTarget): Promise<ServiceHealthItem> {
  const startedAt = Date.now();
  const checkedAt = startedAt;
  const timeoutMs = Number(process.env.SERVICE_PROBE_TIMEOUT_MS ?? 2500);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let statusCode: number | null = null;
  let errorMessage: string | null = null;

  try {
    const response = await fetch(target.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'HELM-Probe/1.0',
      },
    });

    statusCode = response.status;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Probe failed';
    errorMessage = message;
  } finally {
    clearTimeout(timeout);
  }

  const latencyMs = Date.now() - startedAt;
  const status = classifyStatus(statusCode, Boolean(errorMessage));

  return {
    id: target.id,
    name: target.name,
    category: target.category,
    url: target.url,
    status,
    httpStatus: statusCode,
    latencyMs,
    checkedAt,
    message: resolveMessage(status, statusCode, errorMessage),
  };
}

class ServiceHealthService {
  private cache: ServiceHealthSnapshot | null = null;

  private cacheAt = 0;

  private refreshPromise: Promise<ServiceHealthSnapshot> | null = null;

  private readonly cacheTtlMs = 15_000;

  async getSnapshot(forceFresh = false): Promise<ServiceHealthSnapshot> {
    if (!forceFresh && this.cache && Date.now() - this.cacheAt < this.cacheTtlMs) {
      return this.cache;
    }

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

  private async collect(): Promise<ServiceHealthSnapshot> {
    const services = await Promise.all(probeTargets.map((target) => probeTarget(target)));
    const checkedAt = Date.now();

    const summary = services.reduce(
      (acc, service) => {
        if (service.status === 'healthy') {
          acc.healthy += 1;
        } else if (service.status === 'warning') {
          acc.warning += 1;
        } else {
          acc.critical += 1;
        }

        return acc;
      },
      { healthy: 0, warning: 0, critical: 0 },
    );

    const snapshot: ServiceHealthSnapshot = {
      checkedAt,
      summary,
      services,
    };

    this.cache = snapshot;
    this.cacheAt = checkedAt;

    return snapshot;
  }
}

export const serviceHealthService = new ServiceHealthService();
