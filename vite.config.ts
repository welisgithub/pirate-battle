import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Keep images as files so loading failures can be exercised in E2E tests.
    assetsInlineLimit: 0,
  },
});
