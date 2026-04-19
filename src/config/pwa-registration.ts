import { registerSW } from 'virtual:pwa-register';

export function init() {
  // Update the service worker immediately when a new version is available
  registerSW({ immediate: true });
}
