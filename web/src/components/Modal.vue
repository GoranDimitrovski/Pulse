<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

defineProps<{ title: string }>();
const emit = defineEmits<{ close: [] }>();

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Escape') emit('close');
}

onMounted(() => document.addEventListener('keydown', onKeyDown));
onUnmounted(() => document.removeEventListener('keydown', onKeyDown));
</script>

<template>
  <div class="modal-backdrop" @click="emit('close')">
    <div class="modal-panel" role="dialog" aria-modal="true" @click.stop>
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="modal-close" aria-label="Close" @click="emit('close')">×</button>
      </div>
      <slot />
    </div>
  </div>
</template>
