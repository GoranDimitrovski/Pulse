<script setup lang="ts">
import { ref, watch } from 'vue';

import { api } from '../lib/api.js';
import type { DashboardEntry } from '../lib/types.js';
import Sparkline from './Sparkline.vue';
import StatusBadge from './StatusBadge.vue';

const props = defineProps<{ entry: DashboardEntry }>();
const emit = defineEmits<{ delete: [id: string] }>();

const latencyHistory = ref<number[]>([]);

function targetSummary(target: DashboardEntry['target']): string {
  if (target.type === 'http') return target.config.url ?? '';
  if (target.type === 'tcp') return `${target.config.host ?? ''}:${String(target.config.port ?? '')}`;
  return target.config.host ?? '';
}

watch(
  () => [props.entry.target.id, props.entry.latestResult?.id] as const,
  () => {
    api
      .history(props.entry.target.id, 24)
      .then((history) => {
        latencyHistory.value = history
          .filter((h) => h.latencyMs !== null)
          .map((h) => h.latencyMs!)
          .reverse();
      })
      .catch(() => undefined);
  },
  { immediate: true },
);
</script>

<template>
  <div class="target-card">
    <div class="row">
      <h3>{{ entry.target.name }}</h3>
      <StatusBadge :status="entry.latestResult?.status ?? 'unknown'" />
    </div>
    <div class="type-badge">{{ entry.target.type }}</div>
    <div class="target-meta">
      <span :title="targetSummary(entry.target)">{{ targetSummary(entry.target) }}</span>
      <span>{{ entry.latestResult?.latencyMs != null ? `${entry.latestResult.latencyMs} ms` : '—' }}</span>
    </div>
    <div v-if="entry.latestResult?.message" class="target-message">{{ entry.latestResult.message }}</div>
    <Sparkline :values="latencyHistory" :status="entry.latestResult?.status" />
    <div class="target-meta">
      <span>Every {{ entry.target.intervalSeconds }}s</span>
      <button class="secondary" @click="emit('delete', entry.target.id)">Delete</button>
    </div>
  </div>
</template>
