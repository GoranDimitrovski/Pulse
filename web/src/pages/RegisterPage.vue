<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { ApiError } from '../lib/api.js';
import { useAuth } from '../lib/auth.js';

const { register } = useAuth();
const router = useRouter();

const tenantName = ref('');
const email = ref('');
const password = ref('');
const error = ref<string | null>(null);
const submitting = ref(false);

async function handleSubmit(): Promise<void> {
  error.value = null;
  submitting.value = true;
  try {
    await register(tenantName.value, email.value, password.value);
    await router.push('/');
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Registration failed';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="center-screen">
    <div class="auth-card">
      <h1>Create your organization</h1>
      <p class="subtitle">Start monitoring in under a minute</p>
      <form @submit.prevent="handleSubmit">
        <label>Organization name</label>
        <input v-model="tenantName" required />
        <label>Email</label>
        <input v-model="email" type="email" required />
        <label>Password</label>
        <input v-model="password" type="password" minlength="8" required />
        <p v-if="error" class="error-text">{{ error }}</p>
        <button class="primary" type="submit" :disabled="submitting">
          {{ submitting ? 'Creating…' : 'Create organization' }}
        </button>
      </form>
      <p class="footer-link">Already have an account? <RouterLink to="/login">Sign in</RouterLink></p>
    </div>
  </div>
</template>
