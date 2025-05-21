import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import package_json from './package.json';

const common_screenshot_params = {
  sizes: '1148x969',
  type: 'image/png',
  //form_factor: 'wide' as 'narrow' | 'wide',
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false,
      },
      workbox: {
        globPatterns: ['**/*'],
        cleanupOutdatedCaches: true,
        sourcemap: false,
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
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
            src: '/icon-144-maskable.png',
            type: 'image/png',
            sizes: '144x144',
            purpose: 'any',
          },
          {
            src: '/icon-144-maskable.png',
            type: 'image/png',
            sizes: '144x144',
            purpose: 'maskable',
          },
          {
            src: '/icon-192-maskable.png',
            type: 'image/png',
            sizes: '192x192',
            purpose: 'maskable',
          },
          {
            src: '/icon-192.png',
            type: 'image/png',
            sizes: '192x192',
            purpose: 'any',
          },
          {
            src: '/icon-256-maskable.png',
            type: 'image/png',
            sizes: '256x256',
            purpose: 'maskable',
          },
          {
            src: '/icon-256-maskable.png',
            type: 'image/png',
            sizes: '256x256',
            purpose: 'any',
          },
          {
            src: '/icon-512-maskable.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'maskable',
          },
          {
            src: '/icon-512.png',
            type: 'image/png',
            sizes: '512x512',
            purpose: 'any',
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
            src: 'screenshots/session_designer.png',
            label: 'View of Session Designer Page',
          },
          {
            ...common_screenshot_params,
            src: 'screenshots/visualization.png',
            label: 'Illustration of recorded data',
          },
          {
            ...common_screenshot_params,
            src: 'screenshots/group_editor.png',
            label: 'View of Group Editor Page',
          },
          {
            ...common_screenshot_params,
            src: 'screenshots/key_editor.png',
            label: 'View of Keyboard Editor Page',
          },
          {
            ...common_screenshot_params,
            src: 'screenshots/landing_page.png',
            label: 'View of Landing Page',
          },
          {
            ...common_screenshot_params,
            src: 'screenshots/session_recorder.png',
            label: 'View of Session Recorder Page',
          },
          {
            ...common_screenshot_params,
            src: 'screenshots/within_session_preview.png',
            label: 'View of Session Inspection Page',
          },
        ],
      },
    }),
  ],
  assetsInclude: ['**/*.md'],
  define: {
    BUILD_DATE: JSON.stringify(new Date().toLocaleDateString('en-US')),
    BUILD_VERSION: JSON.stringify(package_json.version),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
