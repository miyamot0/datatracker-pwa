import { defineConfig, loadEnv, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import package_json from './package.json' with { type: 'json' };
import { viteSingleFile } from 'vite-plugin-singlefile';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import csp from 'vite-plugin-csp-guard';
import { deleteUnnecessaryPlugin } from './scripts/plugins/delete-unnecessary-files.ts';
import { scrubIslandHtmlPlugin } from './scripts/plugins/scrub-island-html.ts';
import { inlineWorkersPlugin } from './scripts/plugins/inline-workers.ts';
import { prerenderDocsPlugin } from './scripts/plugins/prerender-docs.ts';

const common_screenshot_params = {
  sizes: '1148x969',
  type: 'image/webp',
  form_factor: 'wide' as 'narrow' | 'wide',
};

export const PROD_OUT_DIR: string = 'dist';
export const ISLAND_OUT_DIR: string = 'dist-island';

export type Modality = 'base' | 'island';

const islandPlugins: PluginOption[] = [
  tanstackRouter({
    target: 'react',
    autoCodeSplitting: true,
  }),
  react(),
  tailwindcss(),
  prerenderDocsPlugin,
  inlineWorkersPlugin,
  scrubIslandHtmlPlugin,
  viteSingleFile({
    removeViteModuleLoader: true,
    overrideConfig: {
      base: './',
    },
  }),
  deleteUnnecessaryPlugin,
];

const basePlugins: PluginOption[] = [
  tanstackRouter({
    target: 'react',
    autoCodeSplitting: true,
  }),
  react(),
  tailwindcss(),
  prerenderDocsPlugin,
  csp({
    dev: {
      run: false,
      outlierSupport: ['tailwind'],
    },
    policy: {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'script-src-elem': ["'self'"],
      'style-src': ["'self'", "'unsafe-hashes'"],
      'style-src-elem': ["'self'", "'unsafe-inline'"],
      'style-src-attr': ["'unsafe-hashes'"],
      'connect-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'https:'],
      'font-src': ["'self'"],
      'worker-src': ["'self'"],
      'manifest-src': ["'self'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
    },
    build: {
      sri: true,
    },
  }),
  VitePWA({
    disable: process.env.NODE_ENV !== 'production',
    registerType: 'autoUpdate',
    showMaximumFileSizeToCacheInBytesWarning: false,
    devOptions: {
      enabled: true,
    },
    workbox: {
      disableDevLogs: true,
      globPatterns: ['**/*.{js,css,html,ico,png,svg,md,woff2}'],
      globIgnores: ['**/*.map', 'sw.js', 'workbox-*.js', '/docs/*.webp'],
      cleanupOutdatedCaches: true,
      inlineWorkboxRuntime: true,
      sourcemap: false,
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.destination === 'document',
          handler: 'NetworkFirst',
        },
        {
          urlPattern: ({ request }) => request.destination === 'script',
          handler: 'CacheFirst',
        },
        {
          urlPattern: ({ request }) => request.destination === 'style',
          handler: 'CacheFirst',
        },
        {
          urlPattern: ({ request }) => request.destination === 'image',
          handler: 'CacheFirst',
        },
      ],
    },
    manifest: {
      theme_color: '#F5F5F5',
      background_color: '#F5F5F5',
      icons: [
        {
          src: '/favicon.ico',
          type: 'image/x-icon',
          sizes: '32x32',
        },
        {
          src: '/icon-128.png',
          type: 'image/png',
          sizes: '128x128',
        },
        {
          src: '/icon-144.png',
          type: 'image/png',
          sizes: '144x144',
        },
        {
          src: '/icon-192.png',
          type: 'image/png',
          sizes: '192x192',
        },
        {
          src: '/icon-256.png',
          type: 'image/png',
          sizes: '256x256',
        },
        {
          src: '/icon-512.png',
          type: 'image/png',
          sizes: '512x512',
        },
        {
          src: '/icon-512-maskable.png',
          type: 'image/png',
          sizes: '512x512',
          purpose: 'maskable',
        },
      ],
      orientation: 'any',
      dir: 'ltr',
      lang: 'en-US',
      name: 'DataTracker Electronic Data Collection System',
      short_name: 'DataTracker',
      description:
        'DataTracker is a web-based electronic data collection system that allows users to collect, store, and analyze data.',
      scope: '/',
      display: 'standalone',
      start_url: '/',
      id: '/',
      screenshots: [
        {
          ...common_screenshot_params,
          src: 'screenshots/session_designer_page.webp',
          label: 'View of Session Designer Page',
        },
        {
          ...common_screenshot_params,
          src: 'screenshots/rate_visuals_page.webp',
          label: 'Illustration of recorded data',
        },
        {
          ...common_screenshot_params,
          src: 'screenshots/groups_authorized_page.webp',
          label: 'View of Group Editor Page',
        },
        {
          ...common_screenshot_params,
          src: 'screenshots/keyset_editor_page.webp',
          label: 'View of Keyboard Editor Page',
        },
        {
          ...common_screenshot_params,
          src: 'screenshots/home_page.webp',
          label: 'View of Landing Page',
        },
        {
          ...common_screenshot_params,
          src: 'screenshots/session_recorder_page.webp',
          label: 'View of Session Recorder Page',
        },
        {
          ...common_screenshot_params,
          src: 'screenshots/within_session_preview.webp',
          label: 'View of Session Inspection Page',
        },
      ],
    },
  }),
];

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const MODALITY: Modality = (process.env.VITE_MODE || 'base') as Modality;

  const plugins = MODALITY === 'island' ? islandPlugins : basePlugins;
  const base = MODALITY === 'island' ? '/' : './';
  const define = {
    BUILD_DATE: JSON.stringify(new Date().toLocaleDateString('en-US')),
    BUILD_VERSION: JSON.stringify(package_json.version),
  };

  const assetsInlineLimit = MODALITY === 'island' ? Number.MAX_SAFE_INTEGER : undefined;
  const outDir = MODALITY === 'island' ? ISLAND_OUT_DIR : PROD_OUT_DIR;

  return {
    plugins,
    base,
    define,
    server: {
      headers: {
        // Note: Support needed for SharedArrayBuffer
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    preview: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
    build: {
      assetsInlineLimit,
      minify: true,
      outDir,
      rollupOptions: {
        external: [/\.test\.(js|ts|tsx)$/, '**/__tests__/**/*', '**/*.test.{ts,tsx}', '/docs/*.webp'],
      },
    },
  };
});
