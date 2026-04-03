import type { EventName, EventPayload, AnalyticsEventMap } from '@/types/analytics';
import { queueEvent } from './analytics-queue';
import { analyticsConfig } from './analytics-config';
import { hasConsent } from './analytics-consent';

class AnalyticsClient {
  private measurementId = analyticsConfig.measurementId;
  private apiSecret = analyticsConfig.apiSecret;

  async track<T extends EventName>(name: T, params: AnalyticsEventMap[T]) {
    if (!hasConsent()) return;

    if (!analyticsConfig.enabled) {
      if (analyticsConfig.isDev) {
        console.log('[Analytics:DEV]', name, params);
      }
      return;
    }

    const event: EventPayload<T> = {
      name,
      params,
      timestamp: Date.now(),
    };

    if (navigator.onLine) {
      try {
        await this.send(event);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        await queueEvent(event);
      }
    } else {
      await queueEvent(event);
    }
  }

  async send(event: EventPayload) {
    if (!hasConsent()) return;

    const url = `https://www.google-analytics.com/mp/collect?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`;

    const body = {
      client_id: this.getClientId(),
      events: [
        {
          name: event.name,
          params: {
            ...event.params,
            timestamp: event.timestamp,
          },
        },
      ],
    };

    // Note: Show log, but don't pollute tracking
    if (analyticsConfig.isDev) {
      console.log('[Analytics SEND]', body);
      return;
    }

    await fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      keepalive: true, // helps on page unload
    });
  }

  private getClientId() {
    let id = localStorage.getItem('ga_client_id');

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('ga_client_id', id);
    }

    return id;
  }
}

export const analytics = new AnalyticsClient();
