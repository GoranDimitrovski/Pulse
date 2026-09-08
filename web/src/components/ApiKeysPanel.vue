<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { api, ApiError } from '../lib/api.js';
import type { ApiKey } from '../lib/types.js';
import Modal from './Modal.vue';

const keys = ref<ApiKey[]>([]);
const creating = ref(false);
const name = ref('');
const error = ref<string | null>(null);
const revealedKey = ref<string | null>(null);

onMounted(() => {
  api.listApiKeys().then((result) => (keys.value = result)).catch(() => undefined);
});

async function handleCreate(): Promise<void> {
  if (!name.value.trim()) return;
  error.value = null;
  try {
    const created = await api.createApiKey(name.value);
    keys.value = [...keys.value, created];
    revealedKey.value = created.plainTextKey ?? null;
    name.value = '';
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Failed to create key';
  }
}

async function handleRevoke(id: string): Promise<void> {
  await api.revokeApiKey(id);
  keys.value = keys.value.filter((k) => k.id !== id);
}

function closeModal(): void {
  creating.value = false;
  revealedKey.value = null;
  error.value = null;
}
</script>

<template>
  <div class="card">
    <p v-if="keys.length === 0" class="muted">No API keys yet.</p>
    <div v-for="key in keys" :key="key.id" class="list-row">
      <span>
        <strong>{{ key.name }}</strong> <span class="muted">{{ key.keyPrefix }}…</span>
      </span>
      <button class="danger" @click="handleRevoke(key.id)">Revoke</button>
    </div>

    <button class="add-button" style="margin-top: 16px" @click="creating = true">+ Create key</button>

    <Modal v-if="creating" title="Create API key" @close="closeModal">
      <template v-if="revealedKey">
        <p class="muted" style="margin-top: 0">Save this key now — it won't be shown again.</p>
        <div class="key-reveal">{{ revealedKey }}</div>
        <button class="primary" @click="closeModal">Done</button>
      </template>
      <template v-else>
        <label>Key name</label>
        <input v-model="name" placeholder="e.g. ci-key" autofocus />
        <p v-if="error" class="error-text">{{ error }}</p>
        <button class="primary" @click="handleCreate">Create key</button>
      </template>
    </Modal>
  </div>
</template>
