import { getQueuedEvents, clearQueuedEvents, deleteAllEvents } from './analytics-queue';
import { analytics } from './analytics-client';
import type { EventPayload } from '@/types/analytics';
import { analyticsConfig } from './analytics-config';
import { hasConsent } from './analytics-consent';

const BATCH_SIZE = 20;
const RETRY_INTERVAL = 30_000;

/**
 * Batch logs to send, rather than all at once
 *
 * @return {T[][]} An array of event batches
 */
function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Flush queued events to the analytics server
 *
 * @return {Promise<void>} A promise that resolves when all events have been processed
 */
export async function flushEvents() {
  if (!navigator.onLine) return;

  const events = await getQueuedEvents();
  if (!events.length) return;

  const batches = chunk(events, BATCH_SIZE);

  for (const batch of batches) {
    try {
      await Promise.all(batch.map((event: EventPayload) => analytics.send(event)));
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // Stop processing on failure → retry later
      console.warn('[Analytics] Batch failed, retrying later');
      return;
    }
  }

  await clearQueuedEvents();
}

/**
 * Start syncing queued analytics events when back online and at regular intervals in production
 */
export function startAnalyticsSync() {
  if (!analyticsConfig.enabled) return;

  window.addEventListener('online', flushEvents);

  if (analyticsConfig.isProd) {
    setInterval(flushEvents, RETRY_INTERVAL);
  }
}

// Listen in case user revokes consent after events have been queued, to clear any stored data
window.addEventListener('analytics-consent-changed', async () => {
  if (!hasConsent()) {
    await deleteAllEvents();
  }
});
