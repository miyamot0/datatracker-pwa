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
 * Initialize Google Analytics configuration
 * This replaces the inline script configuration for better CSP compliance
 */
function initializeGoogleAnalytics() {
  // Check if gtag is available (loaded by external script)
  if (typeof window.gtag !== 'function') {
    if (analyticsConfig.isDev) {
      console.warn('gtag not available - Google Analytics not loaded');
    }
    return;
  }

  if (analyticsConfig.measurementId) {
    window.gtag('config', analyticsConfig.measurementId, {
      send_page_view: false, // important for SPA/PWA
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      transport_type: 'beacon',
    });

    if (analyticsConfig.isDev) {
      console.log('✅ Google Analytics initialized:', analyticsConfig.measurementId);
    }
  }
}

/**
 * Start syncing queued analytics events when back online and at regular intervals in production
 */
export function startAnalyticsSync() {
  if (!analyticsConfig.enabled) {
    if (analyticsConfig.isDev) {
      console.log('📊 Analytics disabled via config');

      return;
    }
    return;
  }

  // Initialize Google Analytics configuration
  initializeGoogleAnalytics();

  window.addEventListener('online', flushEvents);

  // Listen in case user revokes consent after events have been queued, to clear any stored data
  window.addEventListener('analytics-consent-changed', async () => {
    if (!hasConsent()) {
      await deleteAllEvents();
    }
  });

  if (analyticsConfig.isProd) {
    setInterval(flushEvents, RETRY_INTERVAL);
  }

  if (analyticsConfig.isDev) {
    console.log('📊 Analytics sync started');
  }
}
