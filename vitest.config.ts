import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    //maxWorkers: 1,
    include: [
      './src/lib/**/*.test.{ts,tsx}',
      './src/analytics/**/*.test.ts',
      './src/calculations/**/*.test.ts',
      './src/workers/**/*.test.{ts,tsx}',
    ],
    exclude: [...configDefaults.exclude, '**/*-worker.test.{ts,tsx}', '**/*-worker-actual.test.{ts,tsx}'], // Note: Exclude worker tests from default since they often require different setup - see below for separate config
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
      include: ['src/lib/**/*.{ts,tsx}', 'src/calculations/**/*.ts', 'src/analytics/**/*.ts'],
      exclude: ['**/__tests__/**/*', '**/types/**/*', 'src/lib/utils.ts'],
    },
  },
});
