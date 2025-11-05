import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // Explicitly set public directory
  server: {
    port: 3001,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        // Use backend service name in Docker, localhost for local dev
        target:
          process.env.DOCKER === 'true'
            ? 'http://backend:5002'
            : 'http://localhost:5002',
        changeOrigin: true,
      },
    },
  },
});
