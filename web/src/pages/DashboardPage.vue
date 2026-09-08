<script setup lang="ts">
import { onMounted, ref } from 'vue';

import AlertChannelsPanel from '../components/AlertChannelsPanel.vue';
import ApiKeysPanel from '../components/ApiKeysPanel.vue';
import CreateTargetForm from '../components/CreateTargetForm.vue';
import Modal from '../components/Modal.vue';
import TargetCard from '../components/TargetCard.vue';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.js';
import { useDashboardSocket } from '../lib/use-dashboard-socket.js';
import type { Target } from '../lib/types.js';

const { user, logout } = useAuth();
const { entries, connected } = useDashboardSocket();
const loaded = ref(false);
const addingTarget = ref(false);

onMounted(async () => {
  entries.value = await api.dashboard();
  loaded.value = true;
});

async function handleDelete(id: string): Promise<void> {
  await api.deleteTarget(id);
  entries.value = entries.value.filter((e) => e.target.id !== id);
}

function handleCreated(target: Target): void {
  entries.value = [...entries.value, { target, latestResult: null }];
  addingTarget.value = false;
}
</script>

<template>
  <div class="app-shell">
    <div class="topbar">
      <div class="brand">
        <span class="ws-dot" :class="{ connected }" />
        Pulse
      </div>
      <div style="display: flex; align-items: center; gap: 12px">
        <span class="muted">{{ user?.role }}</span>
        <button class="secondary" @click="logout">Sign out</button>
      </div>
    </div>

    <div class="main">
      <div class="section-header">
        <h2>Targets</h2>
        <button class="add-button" @click="addingTarget = true">+ Add target</button>
      </div>

      <div v-if="loaded && entries.length === 0" class="empty-state">
        No targets yet. Add one to start monitoring.
      </div>
      <div v-else class="target-grid">
        <TargetCard v-for="entry in entries" :key="entry.target.id" :entry="entry" @delete="handleDelete" />
      </div>

      <Modal v-if="addingTarget" title="Add a target" @close="addingTarget = false">
        <CreateTargetForm @created="handleCreated" />
      </Modal>

      <div class="section-header">
        <h2>Alert channels</h2>
      </div>
      <AlertChannelsPanel />

      <div class="section-header">
        <h2>API keys</h2>
      </div>
      <ApiKeysPanel />
    </div>
  </div>
</template>
