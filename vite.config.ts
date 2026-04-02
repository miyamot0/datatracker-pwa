import { defineConfig, loadEnv, PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import package_json from './package.json';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'node:fs/promises';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import imagemin from 'imagemin';
import imageminWebp from 'imagemin-webp';

const common_screenshot_params = {
  sizes: '1148x969',
  type: 'image/png',
  form_factor: 'wide' as 'narrow' | 'wide',
};

const PROD_OUT_DIR = 'dist';
const ISLAND_OUT_DIR = 'dist-island';

type Modality = 'base' | 'island';

function PluginSetup(plugins: PluginOption[], approach: Modality) {
  switch (approach) {
    case 'base':
      plugins.push({
        name: 'convert-base-png-docs',
        async writeBundle() {
          // Pull relevant PNGs
          const pngFiles = await fs.readdir(`${PROD_OUT_DIR}/docs`);

          const prePng = performance.now();
          console.log(`Found ${pngFiles.length} PNG files in docs, starting optimization and conversion...`);

          for (const file of pngFiles) {
            if (file.endsWith('.png')) {
              // Convert old
              await imagemin([`${PROD_OUT_DIR}/docs/${file}`], {
                destination: `${PROD_OUT_DIR}/docs`,
                plugins: [imageminWebp({ quality: 75 })],
              });

              // Trash old
              await fs.rm(`${PROD_OUT_DIR}/docs/${file}`);
            }
          }

          const postPng = performance.now();
          console.log('Docs images optimized and converted!', ((postPng - prePng) / 1000).toFixed(2), 'seconds');
          console.log();

          /*
          Note: This wasn't really worth the complexity TBH
          // Pull relevant MDs
          const mdFiles = await fs.readdir(`${PROD_OUT_DIR}/content`);

          console.log(`Found ${mdFiles.length} Markdown files, starting update...`);
          const preMd = performance.now();

          for (const file of mdFiles) {
            if (file.endsWith('.md')) {
              const filePath = `${PROD_OUT_DIR}/content/${file}`;
              let content = await fs.readFile(filePath, 'utf-8');

              // Replace .png with .webp in markdown content
              content = content.replaceAll('.png', '.webp');

              await fs.writeFile(filePath, content, 'utf-8');
            }
          }
          const postMd = performance.now();
          console.log(
            'Markdown files updated with new image formats!',
            ((postMd - preMd) / 1000).toFixed(2),
            'seconds',
          );
          console.log();
          */
        },
      });
      plugins.push(
        VitePWA({
          registerType: 'autoUpdate',
          showMaximumFileSizeToCacheInBytesWarning: false,
          devOptions: {
            enabled: true,
          },
          workbox: {
            disableDevLogs: true,
            globPatterns: ['**/*.{js,css,html,ico,png,svg,md,woff2}'],
            globIgnores: ['**/*.map', 'sw.js', 'workbox-*.js', '/docs/*.png'],
            cleanupOutdatedCaches: true,
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
              {
                urlPattern: /https:\/\/www\.google-analytics\.com/,
                handler: 'NetworkOnly',
                options: {
                  backgroundSync: {
                    name: 'ga-queue',
                    options: {
                      maxRetentionTime: 24 * 60, // retry for 24 hours
                    },
                  },
                },
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
                src: 'screenshots/session_designer_page.png',
                label: 'View of Session Designer Page',
              },
              {
                ...common_screenshot_params,
                src: 'screenshots/rate_visuals_page.png',
                label: 'Illustration of recorded data',
              },
              {
                ...common_screenshot_params,
                src: 'screenshots/groups_authorized_page.png',
                label: 'View of Group Editor Page',
              },
              {
                ...common_screenshot_params,
                src: 'screenshots/keyset_editor_page.png',
                label: 'View of Keyboard Editor Page',
              },
              {
                ...common_screenshot_params,
                src: 'screenshots/home_page.png',
                label: 'View of Landing Page',
              },
              {
                ...common_screenshot_params,
                src: 'screenshots/session_recorder_page.png',
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
      );
      break;

    default:
      plugins.push(
        viteSingleFile({
          removeViteModuleLoader: true,
          overrideConfig: {
            base: './',
          },
        }),
      );
      plugins.push({
        name: 'delete-unnecessary',
        async writeBundle() {
          await fs.rm(`${ISLAND_OUT_DIR}/screenshots`, { recursive: true });
          await fs.rm(`${ISLAND_OUT_DIR}/manifest.json`);
          await fs.rm(`${ISLAND_OUT_DIR}/robots.txt`);

          (await fs.readdir(ISLAND_OUT_DIR))
            .filter((f) => f.endsWith('.png'))
            .forEach((f) => fs.rm(`${ISLAND_OUT_DIR}/${f}`));
        },
      });
      break;
  }

  return plugins;
}

export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  const MODALITY: Modality = (process.env.VITE_MODE || 'base') as Modality;
  const plugins = PluginSetup(
    [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
    ],
    MODALITY,
  );

  return {
    plugins,
    //assetsInclude: ['**/*.md'],
    base: MODALITY === 'island' ? '/' : './',
    define: {
      BUILD_DATE: JSON.stringify(new Date().toLocaleDateString('en-US')),
      BUILD_VERSION: JSON.stringify(package_json.version),
    },
    // Note: Support needed for SharedArrayBuffer
    server: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
      cors: true,
    },
    preview: {
      headers: {
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Opener-Policy': 'same-origin',
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      assetsInlineLimit: MODALITY === 'island' ? Number.MAX_SAFE_INTEGER : undefined,
      minify: true,
      outDir: MODALITY === 'island' ? ISLAND_OUT_DIR : PROD_OUT_DIR,
      rollupOptions: {
        external: [/\.test\.(js|ts|tsx)$/, '**/__tests__/**/*', '**/*.test.{ts,tsx}', '/docs/*.png'],
        output: {
          manualChunks: (id) => {
            if (id.includes('react-markdown')) {
              return 'react-markdown';
            }
          },
        },
      },
    },
  };
});
