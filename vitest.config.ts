import { defineConfig, configDefaults } from 'vitest/config';
import path from 'path';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    projects: [
      {
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
          },
        },
        test: {
          browser: {
            provider: playwright(),
            enabled: true,
            headless: true,
            viewport: { width: 1280, height: 720 },
            screenshotFailures: false,
            // TODO: Reference later on when complete
            screenshotDirectory: './public/screenshots2',

            instances: [
              { browser: 'chromium' },
              // TODO: Test on relevant other browsers
              // { browser: 'firefox' },
              // { browser: 'webkit' }
            ],
          },
          include: ['./**/*.spec.tsx'],
          exclude: [...configDefaults.exclude, '**/*.test.{ts,tsx}'],
          globals: true,
          name: 'browser-tests',
        },
      },
      {
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
          },
        },
        test: {
          // TODO: Eventually separate UI from logic, its mixed ATM
          browser: {
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
          // TODO: Just .ts in the future, move out components to separate UI/Logic
          include: ['./**/*.test.{ts,tsx}'],
          exclude: [
            ...configDefaults.exclude,
            '**/*-worker.test.{ts,tsx}',
            '**/*.spec.{ts,tsx}',
            '**/*-worker-actual.test.{ts,tsx}',
          ], // Note: Exclude worker tests from default since they often require different setup - see below for separate config
          environment: 'jsdom',
          globals: true,
          name: 'unit-tests',
        },
      },
    ],
    reporters: ['default'],
    coverage: {
      provider: 'v8',
      reporter: ['json', 'lcov', 'text', 'clover', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'src/lib/**/*.{ts,tsx}',
        'src/calculations/**/*.ts',
        'src/analytics/**/*.ts',
        'src/components/elements/**/*.{ts,tsx}',
        'src/components/pages/**/*.{ts,tsx}',
      ],
      exclude: ['**/__tests__/**/*', '**/types/**/*', 'src/lib/utils.ts', 'src/components/ui/**'],
    },
    onConsoleLog(log: string, type: 'stdout' | 'stderr') {
      if (type === 'stderr') return false; // Note: Let things fail silently when expected
      if (type === 'stdout') return false; // Note: Simply output since so many tests
      return true;
    },
  },
});
