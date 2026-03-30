import { defineConfig, configDefaults, TestProjectConfiguration } from 'vitest/config';
import path from 'path';
import { playwright } from '@vitest/browser-playwright';
import { CoverageV8Options } from 'vitest/node';
import { loadEnv } from 'vite';

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
    ],
    environment: 'jsdom',
    globals: true,
    name: 'unit-tests',
  },
};

type BuildLocation = 'local' | 'vercel';

export default defineConfig(({ command, mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const location: BuildLocation = (process.env.VITE_LOCATION || 'local') as BuildLocation;

  const isVercel = location === 'vercel';

  const projects: TestProjectConfiguration[] = isVercel ? [logicProj] : [componentProj, logicProj];

  const coverage: CoverageV8Options | undefined = isVercel
    ? {
        provider: 'v8',
        reporter: [],
        clean: false,
        reportsDirectory: undefined,
        include: [],
        exclude: [],
      }
    : {
        provider: 'v8',
        reporter: ['json', 'lcov', 'text', 'clover', 'json-summary'],
        clean: true,
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

  return {
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
  };
});
