import { clearEvents, getQueuedEvents } from "./analytic-queue";

export async function flushEvents() {
  if (!navigator.onLine) return;

  const events = await getQueuedEvents();

  for (const event of events) {
    window.gtag?.('event', event.name, event.params);
  }

  await clearEvents();
}

// trigger on reconnect
window.addEventListener('online', flushEvents);
