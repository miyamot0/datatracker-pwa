import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { registerSW } from 'virtual:pwa-register';
import '@/styles/globals.css';

const updateSW = registerSW({
  onNeedRefresh() {
    if (window.confirm('New content available. Reload?')) {
      updateSW(true);
    }
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
