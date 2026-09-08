import { ref } from 'vue';

import { api, tokenStore } from './api.js';
import type { AuthUser } from './types.js';

const user = ref<AuthUser | null>(null);
const loading = ref(true);

let readyResolve!: () => void;
const ready = new Promise<void>((resolve) => (readyResolve = resolve));

async function init(): Promise<void> {
  if (tokenStore.getAccess()) {
    try {
      user.value = await api.me();
    } catch {
      tokenStore.clear();
    }
  }
  loading.value = false;
  readyResolve();
}

void init();

async function login(email: string, password: string): Promise<void> {
  const tokens = await api.login({ email, password });
  tokenStore.set(tokens.accessToken, tokens.refreshToken);
  user.value = await api.me();
}

async function register(tenantName: string, email: string, password: string): Promise<void> {
  await api.register({ tenantName, email, password });
  await login(email, password);
}

async function logout(): Promise<void> {
  const refreshToken = tokenStore.getRefresh();
  tokenStore.clear();
  user.value = null;
  if (refreshToken) await api.logout(refreshToken).catch(() => undefined);
}

/** Module-singleton auth state — every caller shares the same refs, no provider needed. */
export function useAuth() {
  return { user, loading, ready, login, register, logout };
}
