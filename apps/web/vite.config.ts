import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-router-dom')) {
            return 'router';
          }

          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'query';
          }

          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }

          return undefined;
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
