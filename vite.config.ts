import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mdxPlus } from 'vite-plugin-mdx-plus';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// `options` are passed to `@mdx-js/mdx`
const options = {
  // See https://mdxjs.com/advanced/plugins
  remarkPlugins: [
    // E.g. `remark-frontmatter`
  ],
  rehypePlugins: [],
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',

      // add this to cache all the imports
      workbox: {
        globPatterns: ['**/*'],
        cleanupOutdatedCaches: false,
        sourcemap: true,
      },
      // add this to cache all the
      // static assets in the public folder
      includeAssets: ['**/*'],
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
            src: 'screenshots/visualization.png',
            sizes: '1375x860',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Illustration of recorded data',
          },
          {
            src: 'screenshots/group_editor.png',
            sizes: '1375x860',
            type: 'image/png',
            form_factor: 'wide',
            label: 'View of Group Editor Page',
          },
          {
            src: 'screenshots/key_editor.png',
            sizes: '1375x860',
            type: 'image/png',
            form_factor: 'wide',
            label: 'View of Keyboard Editor Page',
          },
          {
            src: 'screenshots/landing_page.png',
            sizes: '1375x860',
            type: 'image/png',
            form_factor: 'wide',
            label: 'View of Landing Page',
          },
          {
            src: 'screenshots/session_designer.png',
            sizes: '1375x860',
            type: 'image/png',
            form_factor: 'wide',
            label: 'View of Session Designer Page',
          },
          {
            src: 'screenshots/session_recorder.png',
            sizes: '1375x860',
            type: 'image/png',
            form_factor: 'wide',
            label: 'View of Session Recorder Page',
          },
          {
            src: 'screenshots/within_session_preview.png',
            sizes: '1375x905',
            type: 'image/png',
            form_factor: 'wide',
            label: 'View of Session Inspection Page',
          },
        ],
      },
    }),
    mdxPlus(options),
  ],
  assetsInclude: ['**/*.mdx'],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
