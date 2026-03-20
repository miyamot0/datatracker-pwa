import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['./src/lib/**/*.test.{ts,tsx}', './src/workers/**/*.test.{ts,tsx}'],
    reporters: ['default'],
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['json', 'lcov', 'text', 'clover', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/lib/**/*.{ts,tsx}', 'src/workers/**/*.{ts,tsx}'],
      exclude: ['**/__tests__/**/*', '**/types/**/*', 'src/lib/utils.ts'],
    },
  },
});
