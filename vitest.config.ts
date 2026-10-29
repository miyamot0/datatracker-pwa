import { defineConfig, configDefaults, TestProjectConfiguration } from 'vitest/config';
import path from 'path';
import { playwright } from '@vitest/browser-playwright';
import tailwindcss from '@tailwindcss/vite';
import { CoverageV8Options } from 'vitest/node';
import { loadEnv } from 'vite';
import { prerenderDocsPlugin } from './scripts/plugins/prerender-docs.ts';

const componentProj: TestProjectConfiguration = {
  extends: false,
  plugins: [tailwindcss(), prerenderDocsPlugin],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    browser: {
      provider: playwright(),
      enabled: true,
      headless: true,
      viewport: { width: 1295, height: 800 },
      screenshotFailures: false,
      screenshotDirectory: './public/screenshots',
      instances: [{ browser: 'chromium' }],
      locators: {
        exact: false,
      },
    },
    clearMocks: false,
    maxConcurrency: 20,
    //maxWorkers: 1,
    include: ['./**/*.spec.tsx'],
    exclude: [...configDefaults.exclude, '**/*.test.{ts,tsx}'],
    globals: true,
    name: 'browser-tests',
  },
};

const logicProj: TestProjectConfiguration = {
  extends: false,
  plugins: [prerenderDocsPlugin],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    clearMocks: false,
    include: ['./**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude, 'src/workers/**', '**/*.spec.{ts,tsx}'],
    environment: 'jsdom',
    globals: true,
    name: 'unit-tests',
  },
};

const workerProj: TestProjectConfiguration = {
  extends: false,
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    clearMocks: false,
    include: ['./src/workers/**/*.test.{ts,tsx}'],
    exclude: [...configDefaults.exclude],
    environment: 'jsdom',
    globals: true,
    name: 'worker-tests',
  },
};

type BuildLocation = 'local' | 'vercel';

export default defineConfig(({ command, mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const location: BuildLocation = (process.env.VITE_LOCATION || 'local') as BuildLocation;

  const isVercel = location === 'vercel';

  const projects: TestProjectConfiguration[] = isVercel
    ? [logicProj]
    : [componentProj, logicProj, workerProj];

  const coverage: CoverageV8Options | undefined = isVercel
    ? {
      provider: 'v8',
      reporter: [],
      clean: false,
      reportsDirectory: './coverage',
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
        'src/workers/**/*.ts',
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
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    test: {
      projects: projects,
      reporters: ['default'],
      coverage: coverage,
      pool: 'vmThreads',

      onConsoleLog(log: string, type: 'stdout' | 'stderr') {
        if (type === 'stderr') return false; // Note: Let things fail silently when expected
        if (type === 'stdout') return false; // Note: Simply output since so many tests
        return true;
      },
    },
  };
});
