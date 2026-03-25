import { queueEvent } from "./analytic-queue";

const MEASUREMENT_ID = 'G-XXXXXXX';

export async function trackEvent(name: string, params: any = {}) {
  const payload = {
    name,
    params,
    timestamp: Date.now(),
  };

  if (navigator.onLine) {
    sendToGA(payload);
  } else {
    await queueEvent(payload);
  }
}

function sendToGA(event: any) {
  // gtag (if loaded)
  if (window.gtag) {
    window.gtag('event', event.name, event.params);
  }
}
