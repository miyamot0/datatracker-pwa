import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import '@/styles/globals.css';
import '@/styles/github.min.css';
import '@/styles/github-dark.min.css';
import { initializeSharedArrayBufferSupport } from '@/lib/shared-buffer.ts';

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
