/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['./src/lib/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    coverage: {
      reporter: ['json', 'lcov', 'text', 'clover', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/lib/**/*.{ts,tsx}'],
      exclude: ['src/lib/__tests__/**/*', 'src/lib/utils.ts'],
    },
  },
});
