<script setup lang="ts">
import { ref, watch } from 'vue';

import { api, ApiError } from '../lib/api.js';
import type { CheckType, Target } from '../lib/types.js';

const emit = defineEmits<{ created: [target: Target] }>();

const DEFAULTS: Record<CheckType, { url: string; host: string; port: string }> = {
  http: { url: 'https://example.com', host: '', port: '' },
  ping: { url: '', host: 'example.com', port: '' },
  tcp: { url: '', host: 'example.com', port: '443' },
  dns: { url: '', host: 'example.com', port: '' },
};

const name = ref('');
const type = ref<CheckType>('http');
const url = ref(DEFAULTS.http.url);
const host = ref(DEFAULTS.http.host);
const port = ref(DEFAULTS.http.port);
const intervalSeconds = ref(60);
const timeoutMs = ref(5000);
const error = ref<string | null>(null);
const submitting = ref(false);

watch(type, (next) => {
  url.value = DEFAULTS[next].url;
  host.value = DEFAULTS[next].host;
  port.value = DEFAULTS[next].port;
});

async function handleSubmit(): Promise<void> {
  error.value = null;
  submitting.value = true;
  try {
    const config =
      type.value === 'http'
        ? { url: url.value }
        : type.value === 'tcp'
          ? { host: host.value, port: Number(port.value) }
          : { host: host.value };

    const target = await api.createTarget({
      name: name.value,
      type: type.value,
      config,
      intervalSeconds: intervalSeconds.value,
      timeoutMs: timeoutMs.value,
    });
    emit('created', target);
    name.value = '';
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Failed to create target';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="form-grid">
      <div class="full">
        <label>Name</label>
        <input v-model="name" required />
      </div>

      <div>
        <label>Type</label>
        <select v-model="type">
          <option value="http">HTTP(S)</option>
          <option value="ping">Ping</option>
          <option value="tcp">TCP</option>
          <option value="dns">DNS</option>
        </select>
      </div>

      <div v-if="type === 'http'">
        <label>URL</label>
        <input v-model="url" required />
      </div>
      <div v-else>
        <label>Host</label>
        <input v-model="host" required />
      </div>

      <div v-if="type === 'tcp'">
        <label>Port</label>
        <input v-model="port" type="number" required />
      </div>

      <div>
        <label>Interval (seconds)</label>
        <input v-model.number="intervalSeconds" type="number" min="5" />
      </div>

      <div>
        <label>Timeout (ms)</label>
        <input v-model.number="timeoutMs" type="number" min="100" />
      </div>
    </div>

    <p v-if="error" class="error-text">{{ error }}</p>
    <button class="primary" type="submit" :disabled="submitting">
      {{ submitting ? 'Adding…' : 'Add target' }}
    </button>
  </form>
</template>
