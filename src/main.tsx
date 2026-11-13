import './trusted-types-init.js';
import '@/lib/zod-config';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import '@/styles/globals.css';
import 'virtual:docs-highlight.css';
import 'sonner/dist/styles.css';

import { initializeSharedArrayBufferSupport } from '@/lib/shared-buffer.ts';

if (import.meta.env.VITE_MODE !== 'island' && import.meta.env.PROD) {
  import('./config/pwa-registration').then(({ init }) => {
    init();
  });
}

// Initialize SharedArrayBuffer support check
initializeSharedArrayBufferSupport();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
