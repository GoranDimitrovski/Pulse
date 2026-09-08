<script setup lang="ts">
import { computed } from 'vue';

import type { CheckStatus } from '../lib/types.js';

const props = withDefaults(
  defineProps<{
    values: number[];
    status?: CheckStatus;
    width?: number;
    height?: number;
  }>(),
  { width: 220, height: 36 },
);

const STATUS_COLOR: Record<CheckStatus, string> = {
  up: '#3fb950',
  down: '#f85149',
  degraded: '#d29922',
};

const color = computed(() => (props.status ? STATUS_COLOR[props.status] : '#4c8dff'));

/** Hand-rolled polyline + area fill; no charting library needed for one trend line. */
const geometry = computed(() => {
  if (props.values.length < 2) return null;

  const max = Math.max(...props.values);
  const min = Math.min(...props.values);
  const range = max - min || 1;
  const step = props.width / (props.values.length - 1);

  const line = props.values
    .map((value, index) => {
      const x = index * step;
      const y = props.height - ((value - min) / range) * (props.height - 4) - 2;
      return `${String(x)},${String(y)}`;
    })
    .join(' ');

  const area = `0,${String(props.height)} ${line} ${String(props.width)},${String(props.height)}`;
  return { line, area };
});
</script>

<template>
  <div v-if="!geometry" class="sparkline sparkline-empty">Collecting data…</div>
  <svg
    v-else
    class="sparkline"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    :aria-label="`Latency trend, last ${values.length} checks`"
  >
    <polyline :points="geometry.area" :fill="color" :fill-opacity="0.12" stroke="none" />
    <polyline :points="geometry.line" fill="none" :stroke="color" stroke-width="1.5" />
  </svg>
</template>
