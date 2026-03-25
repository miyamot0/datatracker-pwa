import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['./src/lib/**/*.test.{ts,tsx}', './src/analytics/**/*.test.ts', './src/hooks/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude],
    reporters: ['default'],
    environment: 'jsdom',
    globals: true,
    onConsoleLog(log: string, type: 'stdout' | 'stderr') {
      if (type === 'stderr') return false; // Note: Let things fail silently when expected
      if (type === 'stdout') return false; // Note: Simply output since so many tests
      return true;
    },
    coverage: {
      provider: 'v8',
      reporter: ['json', 'lcov', 'text', 'clover', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/lib/**/*.{ts,tsx}', 'src/hooks/**/*.{ts,tsx}', 'src/analytics/**/*.ts'],
      exclude: ['**/__tests__/**/*', '**/types/**/*', 'src/lib/utils.ts'],
    },
  },
});
