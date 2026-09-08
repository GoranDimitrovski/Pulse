<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { api, ApiError } from '../lib/api.js';
import type { AlertChannel, AlertChannelType } from '../lib/types.js';
import Modal from './Modal.vue';

const channels = ref<AlertChannel[]>([]);
const adding = ref(false);
const name = ref('');
const type = ref<AlertChannelType>('webhook');
const url = ref('');
const error = ref<string | null>(null);

onMounted(() => {
  api.listAlertChannels().then((result) => (channels.value = result)).catch(() => undefined);
});

async function handleSubmit(): Promise<void> {
  error.value = null;
  try {
    const channel = await api.createAlertChannel({
      name: name.value,
      type: type.value,
      url: url.value,
      enabled: true,
    });
    channels.value = [...channels.value, channel];
    name.value = '';
    url.value = '';
    adding.value = false;
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Failed to create channel';
  }
}

async function handleDelete(id: string): Promise<void> {
  await api.deleteAlertChannel(id);
  channels.value = channels.value.filter((c) => c.id !== id);
}
</script>

<template>
  <div class="card">
    <p v-if="channels.length === 0" class="muted">No alert channels configured yet.</p>
    <div v-for="channel in channels" :key="channel.id" class="list-row">
      <span>
        <strong>{{ channel.name }}</strong> <span class="muted">({{ channel.type }})</span>
      </span>
      <button class="danger" @click="handleDelete(channel.id)">Remove</button>
    </div>

    <button class="add-button" style="margin-top: 16px" @click="adding = true">+ Add channel</button>

    <Modal v-if="adding" title="Add alert channel" @close="adding = false">
      <form class="form-grid" @submit.prevent="handleSubmit">
        <div>
          <label>Name</label>
          <input v-model="name" required />
        </div>
        <div>
          <label>Type</label>
          <select v-model="type">
            <option value="webhook">Webhook</option>
            <option value="discord">Discord</option>
            <option value="slack">Slack</option>
          </select>
        </div>
        <div class="full">
          <label>Webhook URL</label>
          <input v-model="url" required />
        </div>
        <div v-if="error" class="full">
          <p class="error-text">{{ error }}</p>
        </div>
        <div class="full">
          <button class="primary" type="submit">Add channel</button>
        </div>
      </form>
    </Modal>
  </div>
</template>
