import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // Use backend service name in Docker, localhost for local dev
        target:
          process.env.DOCKER === 'true'
            ? 'http://backend:5001'
            : 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
});
