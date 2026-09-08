import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const backendHost = process.env.VITE_BACKEND_HOST ?? 'localhost:3000';

export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': `http://${backendHost}`,
      '/ws': { target: `ws://${backendHost}`, ws: true },
    },
  },
  build: {
    outDir: 'dist',
  },
});
