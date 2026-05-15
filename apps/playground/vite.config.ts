import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@forge3d/viewport': resolve(__dirname, '../../packages/viewport/src/index.ts'),
    },
  },
});
