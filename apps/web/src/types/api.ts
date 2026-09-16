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

export interface RealtimePayload {
  overview: OverviewSnapshot;
  cpu: CpuSnapshot;
  ram: RamSnapshot;
  storage: StorageSnapshot;
  network: NetworkSnapshot;
  insights: OperationalInsights;
  business: BusinessSnapshot;
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

export interface LoginResponse {
  token: string;
  user: {
    username: string;
    role: 'local-admin' | 'local-viewer';
  };
}

export interface SessionResponse {
  authenticated: boolean;
  user: {
    username: string;
    role: 'local-admin' | 'local-viewer';
  };
  session: {
    createdAt: number;
    lastSeenAt: number;
  };
}

export interface MetricsSocketEnvelope {
  type: 'connection.ready' | 'subscription.changed' | 'metrics.snapshot' | 'pong' | 'error';
  data?: RealtimePayload;
  subscribed?: boolean;
  intervalMs?: number;
  message?: string;
  ts?: number;
}

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

export interface ScreenSessionStatus {
  state: 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
  connected: boolean;
  sessionId: string | null;
  transport: 'novnc' | 'tigervnc' | 'x11vnc' | 'placeholder';
  embedUrl: string | null;
  connectedAt: number | null;
  lastConnectedAt: number | null;
  statusMessage: string;
  errorReason: string | null;
  metadata: {
    viewerUrl: string | null;
    viewerToken: string | null;
    websocketUrl: string | null;
    relayMode: 'external-relay' | 'browser-embed' | 'placeholder';
    requiresGateway: boolean;
    targetHost: string;
    activeDisplay: string;
    connectionType: string;
    latencyMs: number | null;
    connectionHealth: 'good' | 'degraded' | 'unknown';
    providerName: string;
    endpointUrl: string | null;
    streamingQuality: 'low' | 'medium' | 'high';
  };
}

export interface ScreenShareLink {
  id: string;
  sourceDevice: string;
  targetDevice: string;
  label: string;
  status: 'active' | 'idle';
  createdAt: number;
  viewerUrl: string | null;
}

export interface ScreenShareLinksSnapshot {
  links: ScreenShareLink[];
  updatedAt: number;
}

export interface ScreenAuditEvent {
  id: string;
  actor: string;
  role: 'local-admin' | 'local-viewer' | 'system';
  action: string;
  target: string;
  timestamp: number;
  details?: string;
}

export interface ScreenAuditSnapshot {
  events: ScreenAuditEvent[];
  updatedAt: number;
}

export interface MediaBroadcastItem {
  title: string;
  sourceType: 'url' | 'file';
  source: string;
  mediaType: 'audio' | 'video';
  mimeType: string | null;
  posterUrl: string | null;
  playbackUrl: string;
}

export interface MediaBroadcastStatus {
  state: 'idle' | 'starting' | 'live' | 'paused' | 'failed';
  isLive: boolean;
  sessionId: string | null;
  startedAt: number | null;
  lastStartedAt: number | null;
  statusMessage: string;
  errorReason: string | null;
  item: MediaBroadcastItem | null;
  metadata: {
    transport: 'html5-audio' | 'html5-video';
    deliveryMode: 'authenticated-stream' | 'direct-url';
    targetPath: string | null;
    canEmbed: boolean;
    providerName: string;
    audience: string;
  };
}

export interface MediaLibraryEntry {
  name: string;
  kind: 'directory' | 'file';
  relativePath: string;
  extension: string;
  size: number;
  modifiedAt: number;
  mediaType: 'audio' | 'video' | null;
  mimeType: string | null;
}

export interface MediaLibraryResponse {
  rootPath: string;
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  entries: MediaLibraryEntry[];
}

export interface TerminalExecuteRequest {
  command: string;
  cwd?: string;
  profile?: 'read-only' | 'admin';
}

export interface TerminalExecutionResult {
  command: string;
  profile: 'read-only' | 'admin';
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

export interface DockerContainer {
  id: string;
  names: string[];
  image: string;
  state: string;
  status: string;
  ports: any[];
  created: number;
}

