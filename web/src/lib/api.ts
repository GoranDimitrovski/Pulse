const ACCESS_TOKEN_KEY = 'pulse.accessToken';
const REFRESH_TOKEN_KEY = 'pulse.refreshToken';

export const tokenStore = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),
  set(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;

  refreshPromise ??= (async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!response.ok) return false;
      const data = (await response.json()) as { accessToken: string; refreshToken: string };
      tokenStore.set(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const accessToken = tokenStore.getAccess();
  const headers = new Headers(init.headers);
  if (init.body !== undefined) headers.set('content-type', 'application/json');
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`);

  const response = await fetch(path, { ...init, headers });

  if (response.status === 401 && retry && tokenStore.getRefresh()) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch<T>(path, init, false);
    tokenStore.clear();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}) as { error?: { message?: string } });
    throw new ApiError(response.status, body.error?.message ?? response.statusText);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const api = {
  register: (input: { tenantName: string; email: string; password: string }) =>
    apiFetch<{ tenantId: string; userId: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  login: (input: { email: string; password: string }) =>
    apiFetch<{ accessToken: string; refreshToken: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  logout: (refreshToken: string) =>
    apiFetch<void>('/api/auth/logout', { method: 'POST', body: JSON.stringify({ refreshToken }) }),

  me: () => apiFetch<import('./types.js').AuthUser>('/api/auth/me'),

  dashboard: () => apiFetch<import('./types.js').DashboardEntry[]>('/api/dashboard'),

  history: (targetId: string, sinceHours = 24) =>
    apiFetch<import('./types.js').CheckResult[]>(
      `/api/targets/${targetId}/history?sinceHours=${String(sinceHours)}&limit=100`,
    ),

  createTarget: (input: unknown) =>
    apiFetch<import('./types.js').Target>('/api/targets', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deleteTarget: (id: string) => apiFetch<void>(`/api/targets/${id}`, { method: 'DELETE' }),

  listAlertChannels: () => apiFetch<import('./types.js').AlertChannel[]>('/api/alert-channels'),

  createAlertChannel: (input: unknown) =>
    apiFetch<import('./types.js').AlertChannel>('/api/alert-channels', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  deleteAlertChannel: (id: string) => apiFetch<void>(`/api/alert-channels/${id}`, { method: 'DELETE' }),

  listApiKeys: () => apiFetch<import('./types.js').ApiKey[]>('/api/api-keys'),

  createApiKey: (name: string) =>
    apiFetch<import('./types.js').ApiKey>('/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  revokeApiKey: (id: string) => apiFetch<void>(`/api/api-keys/${id}`, { method: 'DELETE' }),
};
