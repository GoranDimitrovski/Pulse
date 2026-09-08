<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { ApiError } from '../lib/api.js';
import { useAuth } from '../lib/auth.js';

const { login } = useAuth();
const router = useRouter();

const email = ref('');
const password = ref('');
const error = ref<string | null>(null);
const submitting = ref(false);

async function handleSubmit(): Promise<void> {
  error.value = null;
  submitting.value = true;
  try {
    await login(email.value, password.value);
    await router.push('/');
  } catch (err) {
    error.value = err instanceof ApiError ? err.message : 'Login failed';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="center-screen">
    <div class="auth-card">
      <h1>Pulse</h1>
      <p class="subtitle">Sign in to your organization</p>
      <form @submit.prevent="handleSubmit">
        <label>Email</label>
        <input v-model="email" type="email" required />
        <label>Password</label>
        <input v-model="password" type="password" required />
        <p v-if="error" class="error-text">{{ error }}</p>
        <button class="primary" type="submit" :disabled="submitting">
          {{ submitting ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
      <p class="footer-link">No account? <RouterLink to="/register">Create one</RouterLink></p>
    </div>
  </div>
</template>
