import { onMounted, onUnmounted, ref } from 'vue';

import { tokenStore } from './api.js';
import type { CheckResult, DashboardEntry } from './types.js';

interface CheckCompletedMessage {
  type: 'check.completed';
  targetId: string;
  targetName: string;
  result: CheckResult;
}

interface SnapshotMessage {
  type: 'dashboard.snapshot';
  entries: DashboardEntry[];
}

type DashboardMessage = CheckCompletedMessage | SnapshotMessage;

/** Owns the dashboard entries, kept live via WebSocket with automatic reconnect. */
export function useDashboardSocket() {
  const entries = ref<DashboardEntry[]>([]);
  const connected = ref(false);

  let socket: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  function connect(): void {
    const token = tokenStore.getAccess();
    if (!token) return;

    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    socket = new WebSocket(`${protocol}//${location.host}/ws/dashboard?token=${token}`);

    socket.onopen = () => (connected.value = true);
    socket.onclose = () => {
      connected.value = false;
      if (!stopped) reconnectTimer = setTimeout(connect, 3000);
    };
    socket.onerror = () => socket?.close();

    socket.onmessage = (event: MessageEvent<string>) => {
      const message = JSON.parse(event.data) as DashboardMessage;

      if (message.type === 'dashboard.snapshot') {
        entries.value = message.entries;
        return;
      }

      if (message.type === 'check.completed') {
        entries.value = entries.value.map((entry) =>
          entry.target.id === message.targetId ? { ...entry, latestResult: message.result } : entry,
        );
      }
    };
  }

  onMounted(connect);

  onUnmounted(() => {
    stopped = true;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    socket?.close();
  });

  return { entries, connected };
}
