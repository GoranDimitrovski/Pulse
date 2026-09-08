<script setup lang="ts">
import type { CheckStatus } from '../lib/types.js';

defineProps<{ status: CheckStatus | 'unknown' }>();
</script>

<template>
  <span class="status-badge" :class="`status-${status}`">
    <span class="dot" />
    {{ status }}
  </span>
</template>
