export interface MetricPoint {
  timestamp: number;
  value: number;
}

export interface ActivityItem {
  id: string;
  source: 'system' | 'files' | 'screen' | 'auth' | 'media' | 'terminal' | 'docker';
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
}

export interface HealthIndicator {
  label: string;
  status: 'healthy' | 'warning' | 'critical';
  description: string;
}

export interface CpuSnapshot {
  totalUsage: number;
  perCore: number[];
  loadAverage: [number, number, number];
  frequencyMHz: number | null;
  temperatureC: number | null;
  history: MetricPoint[];
}

export interface RamSnapshot {
  total: number;
  used: number;
  free: number;
  buffers: number | null;
  cache: number | null;
  swap: {
    total: number | null;
    used: number | null;
    free: number | null;
  };
  usagePercent: number;
  history: MetricPoint[];
}

export interface StoragePartition {
  name: string;
  mountPoint: string;
  filesystem: string;
  total: number;
  used: number;
  free: number;
  usagePercent: number;
}

export interface StorageSnapshot {
  total: number;
  used: number;
  free: number;
  partitions: StoragePartition[];
  history: MetricPoint[];
}

export interface NetworkInterfaceInfo {
  name: string;
  address: string;
}

export interface NetworkSnapshot {
  hostname: string;
  currentUser: string;
  localIp: string;
  interfaces: NetworkInterfaceInfo[];
}

export interface ConnectedDevice {
  ip: string;
  mac: string | null;
  iface: string | null;
  state: string | null;
  source: 'arp' | 'neigh';
}

export interface ConnectedDevicesSnapshot {
  scannedAt: number;
  devices: ConnectedDevice[];
}

export interface ServiceHealthItem {
  id: string;
  name: string;
  category: 'media' | 'automation' | 'network' | 'observability' | 'containers' | 'other';
  url: string;
  status: 'healthy' | 'warning' | 'critical';
  httpStatus: number | null;
  latencyMs: number;
  checkedAt: number;
  message: string;
}

export interface ServiceHealthSnapshot {
  checkedAt: number;
  summary: {
    healthy: number;
    warning: number;
    critical: number;
  };
  services: ServiceHealthItem[];
}

export interface OverviewSnapshot {
  uptimeSeconds: number;
  hostname: string;
  currentUser: string;
  localIp: string;
  systemStatus: 'healthy' | 'warning' | 'critical';
  cpuUsage: number;
  ramUsage: number;
  storageUsage: number;
  health: HealthIndicator[];
  recentActivity: ActivityItem[];
}

export interface OperationalRecommendation {
  id: string;
  severity: 'healthy' | 'warning' | 'critical';
  title: string;
  description: string;
}

export interface ResourceFocus {
  resource: 'CPU' | 'Memory' | 'Storage';
  status: 'healthy' | 'warning' | 'critical';
  value: number;
  note: string;
}

export interface BusiestPartitionSummary {
  name: string;
  mountPoint: string;
  usagePercent: number;
  free: number;
}

export interface OperationalInsights {
  headline: string;
  summary: string;
  posture: 'healthy' | 'warning' | 'critical';
  focus: ResourceFocus;
  busiestPartition: BusiestPartitionSummary | null;
  recommendations: OperationalRecommendation[];
}

export interface BusinessSnapshot {
  mrr: number;
  arr: number;
  arpa: number;
  churnRate: number;
  nrr: number;
  activeCustomers: number;
  trialCustomers: number;
  expansionRevenue: number;
  cacPaybackMonths: number;
}

export interface RealtimePayload {
  overview: OverviewSnapshot;
  cpu: CpuSnapshot;
  ram: RamSnapshot;
  storage: StorageSnapshot;
  network: NetworkSnapshot;
  insights: OperationalInsights;
  business: BusinessSnapshot;
}
