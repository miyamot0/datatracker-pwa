import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['./src/lib/**/*.test.{ts,tsx}', './src/workers/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude], // Exclude specific test files
    reporters: ['default'],
    environment: 'jsdom',
    globals: true,
    onConsoleLog(log: string, type: 'stdout' | 'stderr') {
      // Note: Let things fail silently when expected

      if (type === 'stderr') return false;

      return true;
    },
    coverage: {
      provider: 'v8',
      reporter: ['json', 'lcov', 'text', 'clover', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/lib/**/*.{ts,tsx}', 'src/workers/**/*.{ts,tsx}'],
      exclude: ['**/__tests__/**/*', '**/types/**/*', 'src/lib/utils.ts'],
    },
  },
});
