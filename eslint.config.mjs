import eslint from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  globalIgnores([
    'dist',
    'dev-dist',
    'coverage',
    'node_modules',
    '**/*.js',
    'public',
    'scripts',
    '**/*.test.{ts,tsx}',
    '**/__tests__/**',
    '.eslintrc.{js,json}',
    'eslint.config.{js,json}',
    'prettier.rc',
    'components.json',
    'tailwind.config.{js,json}',
    'tsconfig.{json,ts}',
    'tsconfig.app.{json,ts}',
    'tsconfig.node.{json,ts}',
    'vercel.json',
    'vite.config.{js,ts}',
    'vitest.config.{js,ts}',
    'yarn.lock',
  ]),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
);
