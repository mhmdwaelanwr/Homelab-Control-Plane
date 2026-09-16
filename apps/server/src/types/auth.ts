export interface AuthSession {
  token: string;
  username: string;
  role: 'local-admin' | 'local-viewer';
  createdAt: number;
  lastSeenAt: number;
}
