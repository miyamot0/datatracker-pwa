import { analytics } from './analytics-client';
import { analyticsConfig } from './analytics-config';

/**
 * Add in listeners for errors/exceptions
 */
export function setupErrorTracking() {
  window.addEventListener('error', (event) => {
    if (analyticsConfig.isDev) {
      console.error('[Tracked Error]', event);
      return;
    }

    analytics.track('app_error', {
      message: event.message,
      stack: event.error?.stack,
      fatal: true,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (analyticsConfig.isDev) {
      console.error('[Tracked Error]', event);
      return;
    }

    analytics.track('app_error', {
      message: String(event.reason),
      fatal: false,
    });
  });
}
