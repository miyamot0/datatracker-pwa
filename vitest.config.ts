/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['./src/lib/**/*.test.{ts,tsx}'],

    globals: true,
    coverage: {
      reporter: ['json', 'lcov', 'text', 'clover', 'json-summary'],
      reportsDirectory: './coverage',
    },
  },
});
