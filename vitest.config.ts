/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['./src/lib/**/*.test.{ts,tsx}'],
    reporters: ['default'],
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['json', 'lcov', 'text', 'clover', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/lib/**/*.{ts,tsx}'],
      exclude: ['src/lib/__tests__/**/*', 'src/lib/utils.ts', 'src/lib/files.ts'],
    },
  },
});
