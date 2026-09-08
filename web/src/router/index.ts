import { createRouter, createWebHistory } from 'vue-router';

import { useAuth } from '../lib/auth.js';
import DashboardPage from '../pages/DashboardPage.vue';
import LoginPage from '../pages/LoginPage.vue';
import RegisterPage from '../pages/RegisterPage.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginPage, meta: { guestOnly: true } },
    { path: '/register', component: RegisterPage, meta: { guestOnly: true } },
    { path: '/', component: DashboardPage, meta: { requiresAuth: true } },
  ],
});

router.beforeEach(async (to) => {
  const { user, ready } = useAuth();
  await ready; // wait for the initial /api/auth/me check before deciding

  if (to.meta.requiresAuth && !user.value) return '/login';
  if (to.meta.guestOnly && user.value) return '/';
  return true;
});

export default router;
