import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import '@/styles/globals.css';
import 'virtual:docs-highlight.css';
import 'sonner/dist/styles.css';

import { initializeSharedArrayBufferSupport } from '@/lib/shared-buffer.ts';
import { startAnalyticsSync } from './lib/analytics/analytics-sync.ts';
import { setupErrorTracking } from './lib/analytics/analytics-errors.ts';

import { config } from 'zod';

// Zod version 4.x uses eval for some reason, CSP no likey
config({ jitless: true });

if (import.meta.env.VITE_MODE !== 'island' && import.meta.env.PROD) {
  import('./config/pwa-registration').then(({ init }) => {
    init();
  });
}

// Initialize SharedArrayBuffer support check
initializeSharedArrayBufferSupport();

startAnalyticsSync();
setupErrorTracking();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
