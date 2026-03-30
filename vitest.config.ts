import { defineConfig, configDefaults, TestProjectConfiguration } from 'vitest/config';
import path from 'path';
import { playwright } from '@vitest/browser-playwright';
import { CoverageV8Options } from 'vitest/node';

const isVercel = !!process.env.VERCEL_BUILD;

const componentProj: TestProjectConfiguration = {
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
      screenshotDirectory: './public/screenshots2',
      instances: [{ browser: 'chromium' }],
    },
    include: ['./**/*.spec.tsx'],
    exclude: [...configDefaults.exclude, '**/*.test.{ts,tsx}'],
    globals: true,
    name: 'browser-tests',
  },
};

const logicProj: TestProjectConfiguration = {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
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
};

const projects: TestProjectConfiguration[] = isVercel ? [logicProj] : [componentProj, logicProj];

const coverage: CoverageV8Options | undefined = isVercel
  ? undefined
  : {
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
    };

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    projects: projects,
    reporters: ['default'],
    coverage: coverage,
    onConsoleLog(log: string, type: 'stdout' | 'stderr') {
      if (type === 'stderr') return false; // Note: Let things fail silently when expected
      if (type === 'stdout') return false; // Note: Simply output since so many tests
      return true;
    },
  },
});
