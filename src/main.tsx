import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import '@/styles/globals.css';
import '@/styles/github.min.css';
import '@/styles/github-dark.min.css';
import 'sonner/dist/styles.css';
import '@/styles/Spreadsheet.css';

import { initializeSharedArrayBufferSupport } from '@/lib/shared-buffer.ts';
import { startAnalyticsSync } from './lib/analytics/analytics-sync.ts';
import { setupErrorTracking } from './lib/analytics/analytics-errors.ts';
//import { registerSW } from 'virtual:pwa-register';

/*
const updateSW = registerSW({
  onNeedRefresh() {
    if (window.confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
});
*/

// Initialize SharedArrayBuffer support check
initializeSharedArrayBufferSupport();

startAnalyticsSync();
setupErrorTracking();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// @ts-expect-error - Trusted Types is not yet fully supported in TypeScript's DOM typings
if (window.trustedTypes && window.trustedTypes.createPolicy) {
  // @ts-expect-error - Trusted Types is not yet fully supported in TypeScript's DOM typings
  window.trustedTypes.createPolicy('default', {
    createScriptURL: (url: string) => url,
  });
}
