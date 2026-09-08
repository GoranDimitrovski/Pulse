export type Role = 'owner' | 'admin' | 'member';
export type CheckType = 'ping' | 'http' | 'tcp' | 'dns';
export type CheckStatus = 'up' | 'down' | 'degraded';
export type AlertChannelType = 'webhook' | 'discord' | 'slack';

export interface TargetConfig {
  url?: string;
  host?: string;
  port?: number;
  recordType?: string;
  expectedStatusCodes?: number[];
}

export interface Target {
  id: string;
  tenantId: string;
  name: string;
  type: CheckType;
  config: TargetConfig;
  intervalSeconds: number;
  timeoutMs: number;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckResult {
  id: string;
  tenantId: string;
  targetId: string;
  status: CheckStatus;
  latencyMs: number | null;
  message: string | null;
  checkedAt: string;
}

export interface DashboardEntry {
  target: Target;
  latestResult: CheckResult | null;
}

export interface AlertChannel {
  id: string;
  tenantId: string;
  type: AlertChannelType;
  name: string;
  url: string;
  enabled: boolean;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  plainTextKey?: string;
}

export interface AuthUser {
  tenantId: string;
  userId: string;
  role: Role;
}
