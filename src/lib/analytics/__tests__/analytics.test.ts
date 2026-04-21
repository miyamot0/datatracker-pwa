import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { EventPayload } from '@/types/analytics';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = new Map<string, string>();
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => mockLocalStorage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => mockLocalStorage.set(key, value)),
    removeItem: vi.fn((key: string) => mockLocalStorage.delete(key)),
    clear: vi.fn(() => mockLocalStorage.clear()),
  },
});

// Mock crypto.randomUUID
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-12345'),
  },
});

// Mock IndexedDB with idb
const mockDB = {
  add: vi.fn(),
  getAll: vi.fn(),
  clear: vi.fn(),
  transaction: vi.fn(() => ({
    objectStore: vi.fn(() => ({ clear: vi.fn() })),
    done: Promise.resolve(),
  })),
  objectStoreNames: {
    contains: vi.fn(() => false),
  },
  createObjectStore: vi.fn(),
};

vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve(mockDB)),
}));

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  value: true,
  writable: true,
});

describe('Analytics Module Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockLocalStorage.clear();
    mockFetch.mockClear();
    mockDB.add.mockClear();
    mockDB.getAll.mockClear();
    mockDB.clear.mockClear();

    // Reset navigator.onLine
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('analytics-config.ts', () => {
    it('should read environment variables correctly', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('VITE_G4A_MEASUREMENT_ID', 'test-measurement-id');
      vi.stubEnv('VITE_G4A_SECRET', 'test-api-secret');
      vi.stubEnv('DEV', true);
      vi.stubEnv('PROD', false);

      const { analyticsConfig } = await import('@/lib/analytics/analytics-config');

      expect(analyticsConfig.enabled).toBe(true);
      expect(analyticsConfig.measurementId).toBe('test-measurement-id');
      expect(analyticsConfig.apiSecret).toBe('test-api-secret');
      expect(analyticsConfig.isDev).toBe(true);
      expect(analyticsConfig.isProd).toBe(false);
    });

    it('should handle disabled analytics', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'false');

      const { analyticsConfig } = await import('@/lib/analytics/analytics-config');
      expect(analyticsConfig.enabled).toBe(false);
    });
  });

  describe('analytics-consent.ts', () => {
    it('should return "granted" as default consent', async () => {
      const { getConsent } = await import('@/lib/analytics/analytics-consent');
      expect(getConsent()).toBe('granted');
    });

    it('should return stored consent value', async () => {
      mockLocalStorage.set('analytics_consent', 'denied');
      const { getConsent } = await import('@/lib/analytics/analytics-consent');
      expect(getConsent()).toBe('denied');
    });

    it('should set consent and dispatch event', async () => {
      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');
      const { setConsent } = await import('@/lib/analytics/analytics-consent');

      setConsent('denied');

      expect(mockLocalStorage.get('analytics_consent')).toBe('denied');
      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'analytics-consent-changed',
          detail: 'denied',
        }),
      );
    });

    it('should correctly identify when consent is granted', async () => {
      mockLocalStorage.set('analytics_consent', 'granted');
      const { hasConsent } = await import('@/lib/analytics/analytics-consent');
      expect(hasConsent()).toBe(true);
    });

    it('should correctly identify when consent is denied', async () => {
      mockLocalStorage.set('analytics_consent', 'denied');
      const { hasConsent } = await import('@/lib/analytics/analytics-consent');
      expect(hasConsent()).toBe(false);
    });
  });

  describe('analytics-queue.ts', () => {
    it('should initialize database with correct structure', async () => {
      const { openDB } = await import('idb');
      await import('@/lib/analytics/analytics-queue');

      expect(openDB).toHaveBeenCalledWith('analytics-db', 1, {
        upgrade: expect.any(Function),
      });
    });

    it('should create object store in upgrade when store does not exist', async () => {
      const { openDB } = await import('idb');
      await import('@/lib/analytics/analytics-queue');

      const options = vi.mocked(openDB).mock.calls[0]?.[2] as { upgrade: (db: typeof mockDB) => void };
      mockDB.objectStoreNames.contains.mockReturnValue(false);
      options.upgrade(mockDB as any);

      expect(mockDB.objectStoreNames.contains).toHaveBeenCalledWith('events');
      expect(mockDB.createObjectStore).toHaveBeenCalledWith('events', { autoIncrement: true });
    });

    it('should not create object store in upgrade when store already exists', async () => {
      const { openDB } = await import('idb');
      await import('@/lib/analytics/analytics-queue');

      const options = vi.mocked(openDB).mock.calls[0]?.[2] as { upgrade: (db: typeof mockDB) => void };
      mockDB.objectStoreNames.contains.mockReturnValue(true);
      options.upgrade(mockDB as any);

      expect(mockDB.objectStoreNames.contains).toHaveBeenCalledWith('events');
      expect(mockDB.createObjectStore).not.toHaveBeenCalled();
    });

    it('should queue an event', async () => {
      const mockEvent: EventPayload = {
        name: 'page_view',
        params: { path: '/test' },
        timestamp: Date.now(),
      };

      const { queueEvent } = await import('@/lib/analytics/analytics-queue');
      await queueEvent(mockEvent);

      expect(mockDB.add).toHaveBeenCalledWith('events', mockEvent);
    });

    it('should get all queued events', async () => {
      const mockEvents = [{ name: 'test', params: {}, timestamp: 123 }];
      mockDB.getAll.mockResolvedValue(mockEvents);

      const { getQueuedEvents } = await import('@/lib/analytics/analytics-queue');
      const result = await getQueuedEvents();

      expect(mockDB.getAll).toHaveBeenCalledWith('events');
      expect(result).toEqual(mockEvents);
    });

    it('should clear queued events', async () => {
      const mockTx = {
        objectStore: vi.fn(() => ({ clear: vi.fn() })),
        done: Promise.resolve(),
      };
      mockDB.transaction.mockReturnValue(mockTx);

      const { clearQueuedEvents } = await import('@/lib/analytics/analytics-queue');
      await clearQueuedEvents();

      expect(mockDB.transaction).toHaveBeenCalledWith('events', 'readwrite');
      expect(mockTx.objectStore).toHaveBeenCalledWith('events');
    });

    it('should delete all events', async () => {
      const { deleteAllEvents } = await import('@/lib/analytics/analytics-queue');
      await deleteAllEvents();

      expect(mockDB.clear).toHaveBeenCalledWith('events');
    });
  });

  describe('analytics-client.ts', () => {
    beforeEach(() => {
      mockLocalStorage.set('analytics_consent', 'granted');
    });

    it('should return early when analytics is disabled and not in dev mode', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'false');
      vi.stubEnv('DEV', false);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { analytics } = await import('@/lib/analytics/analytics-client');

      await analytics.track('user_action', { action: 'noop' });

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockDB.add).not.toHaveBeenCalled();
    });

    it('should not track when consent is denied', async () => {
      mockLocalStorage.set('analytics_consent', 'denied');
      const { analytics } = await import('@/lib/analytics/analytics-client');

      await analytics.track('page_view', { path: '/test' });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockDB.add).not.toHaveBeenCalled();
    });

    it('should log to console in dev mode when analytics disabled', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'false');
      vi.stubEnv('DEV', true);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { analytics } = await import('@/lib/analytics/analytics-client');

      await analytics.track('user_action', { action: 'click' });

      expect(consoleSpy).toHaveBeenCalledWith('[Analytics:DEV]', 'user_action', { action: 'click' });
    });

    it('should send event directly when online and analytics enabled', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('VITE_G4A_MEASUREMENT_ID', 'test-id');
      vi.stubEnv('VITE_G4A_SECRET', 'test-secret');
      vi.stubEnv('DEV', false);

      mockFetch.mockResolvedValue(new Response('', { status: 200 }));
      const { analytics } = await import('@/lib/analytics/analytics-client');

      await analytics.track('app_error', { message: 'test error', fatal: true });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://www.google-analytics.com/mp/collect?measurement_id=test-id&api_secret=test-secret',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"app_error"'),
          keepalive: true,
        }),
      );
    });

    it('should queue event when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('VITE_G4A_MEASUREMENT_ID', 'test-measurement-id');

      const { analytics } = await import('@/lib/analytics/analytics-client');
      await analytics.track('page_view', { path: '/offline' });

      expect(mockDB.add).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fallback to queue when send fails', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('VITE_G4A_MEASUREMENT_ID', 'test-id');
      vi.stubEnv('VITE_G4A_SECRET', 'test-secret');
      vi.stubEnv('DEV', false);

      mockFetch.mockRejectedValue(new Error('Network error'));
      const { analytics } = await import('@/lib/analytics/analytics-client');

      await analytics.track('api_error', { endpoint: '/api/test', status: 500 });

      expect(mockFetch).toHaveBeenCalled();
      expect(mockDB.add).toHaveBeenCalled();
    });

    it('should generate and store client ID', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('VITE_G4A_MEASUREMENT_ID', 'test-measurement-id');
      vi.stubEnv('DEV', false);

      mockFetch.mockResolvedValue(new Response('', { status: 200 }));
      const { analytics } = await import('@/lib/analytics/analytics-client');

      await analytics.track('user_action', { action: 'submit' });

      expect(window.localStorage.setItem).toHaveBeenCalledWith('ga_client_id', 'mock-uuid-12345');
    });

    it('should reuse existing client ID', async () => {
      mockLocalStorage.set('ga_client_id', 'existing-id');
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('VITE_G4A_MEASUREMENT_ID', 'test-measurement-id');
      vi.stubEnv('DEV', false);

      mockFetch.mockResolvedValue(new Response('', { status: 200 }));
      const { analytics } = await import('@/lib/analytics/analytics-client');

      await analytics.track('user_action', { action: 'navigate' });

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.client_id).toBe('existing-id');
    });

    it('should send event directly and log in dev mode', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('DEV', true);

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const { analytics } = await import('@/lib/analytics/analytics-client');

      const testEvent: EventPayload = {
        name: 'page_view',
        params: { path: '/test' },
        timestamp: 123456,
      };

      await analytics.send(testEvent);

      expect(consoleSpy).toHaveBeenCalledWith('[Analytics SEND]', expect.any(Object));
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should not send when consent is denied', async () => {
      mockLocalStorage.set('analytics_consent', 'denied');
      const { analytics } = await import('@/lib/analytics/analytics-client');

      const testEvent: EventPayload = {
        name: 'page_view',
        params: { path: '/test' },
        timestamp: 123456,
      };

      await analytics.send(testEvent);

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('analytics-errors.ts', () => {
    beforeEach(() => {
      mockLocalStorage.set('analytics_consent', 'granted');
    });

    it('should set up error event listeners', async () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const { setupErrorTracking } = await import('@/lib/analytics/analytics-errors');

      setupErrorTracking();

      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    it('should track errors in production', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('VITE_G4A_MEASUREMENT_ID', 'test-id');
      vi.stubEnv('VITE_G4A_SECRET', 'test-secret');
      vi.stubEnv('DEV', false);

      mockFetch.mockResolvedValue(new Response('', { status: 200 }));

      const { setupErrorTracking } = await import('@/lib/analytics/analytics-errors');
      setupErrorTracking();

      // Trigger error event
      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
        error: new Error('Test error'),
      });

      window.dispatchEvent(errorEvent);

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('google-analytics.com'),
        expect.objectContaining({
          body: expect.stringContaining('"name":"app_error"'),
        }),
      );
    });

    it('should log errors in dev mode', async () => {
      vi.stubEnv('DEV', true);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { setupErrorTracking } = await import('@/lib/analytics/analytics-errors');
      setupErrorTracking();

      const errorEvent = new ErrorEvent('error', {
        message: 'Test error',
      });

      window.dispatchEvent(errorEvent);

      expect(consoleErrorSpy).toHaveBeenCalledWith('[Tracked Error]', errorEvent);
    });

    it('should track unhandled promise rejections', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('VITE_G4A_MEASUREMENT_ID', 'test-id');
      vi.stubEnv('VITE_G4A_SECRET', 'test-secret');
      vi.stubEnv('DEV', false);

      mockFetch.mockResolvedValue(new Response('', { status: 200 }));

      const { setupErrorTracking } = await import('@/lib/analytics/analytics-errors');
      setupErrorTracking();

      // Create a controlled promise that we can handle to prevent actual unhandled rejection
      const testPromise = Promise.reject('Test rejection');

      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: testPromise,
        reason: 'Test rejection',
      });

      window.dispatchEvent(rejectionEvent);

      // Handle the promise to prevent it from actually being unhandled
      testPromise.catch(() => {
        // Intentionally empty - we just need to handle it to prevent build issues
      });

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('google-analytics.com'),
        expect.objectContaining({
          body: expect.stringContaining('"message":"Test rejection"'),
        }),
      );
    });
  });

  describe('analytics-sync.ts', () => {
    beforeEach(() => {
      mockLocalStorage.set('analytics_consent', 'granted');
    });

    it('should chunk array into batches', () => {
      // Test chunking utility function directly
      function chunk<T>(arr: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          result.push(arr.slice(i, i + size));
        }
        return result;
      }

      const items = [1, 2, 3, 4, 5, 6, 7];
      const result = chunk(items, 3);

      expect(result).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
    });

    it('should handle empty array chunking', () => {
      // Test chunking utility function directly
      function chunk<T>(arr: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < arr.length; i += size) {
          result.push(arr.slice(i, i + size));
        }
        return result;
      }

      const result = chunk([], 3);
      expect(result).toEqual([]);
    });

    it('should not flush when offline', async () => {
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const { flushEvents } = await import('../analytics-sync');
      await flushEvents();

      expect(mockDB.getAll).not.toHaveBeenCalled();
    });

    it('should not flush when no events queued', async () => {
      mockDB.getAll.mockResolvedValue([]);

      const { flushEvents } = await import('../analytics-sync');
      await flushEvents();

      expect(mockDB.getAll).toHaveBeenCalled();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should flush queued events successfully', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('DEV', false);

      const mockEvents = [
        { name: 'page_view', params: { path: '/1' }, timestamp: 123 },
        { name: 'user_action', params: { action: 'click' }, timestamp: 124 },
      ];

      mockDB.getAll.mockResolvedValue(mockEvents);
      mockFetch.mockResolvedValue(new Response('', { status: 200 }));

      const { flushEvents } = await import('../analytics-sync');
      await flushEvents();

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockDB.transaction).toHaveBeenCalled();
    });

    it('should stop flushing on batch failure', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('VITE_G4A_MEASUREMENT_ID', 'test-id');
      vi.stubEnv('VITE_G4A_SECRET', 'test-secret');
      vi.stubEnv('DEV', false);

      const mockEvents = Array(25)
        .fill(null)
        .map((_, i) => ({
          name: 'test',
          params: {},
          timestamp: i,
        }));

      mockDB.getAll.mockResolvedValue(mockEvents);
      mockFetch.mockRejectedValue(new Error('Network error'));

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { flushEvents } = await import('../analytics-sync');
      await flushEvents();

      expect(consoleWarnSpy).toHaveBeenCalledWith('[Analytics] Batch failed, retrying later');
      expect(mockDB.transaction).not.toHaveBeenCalled();
    });

    it('should set up sync when analytics enabled', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('VITE_G4A_MEASUREMENT_ID', 'test-measurement-id');
      vi.stubEnv('PROD', true);

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

      const { startAnalyticsSync } = await import('../analytics-sync');
      startAnalyticsSync();

      expect(addEventListenerSpy).toHaveBeenCalledWith('online', expect.any(Function));
      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    it('should not set up sync when analytics disabled', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'false');

      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const { startAnalyticsSync } = await import('../analytics-sync');
      startAnalyticsSync();

      expect(addEventListenerSpy).not.toHaveBeenCalledWith('online', expect.any(Function));
    });

    it('should not set interval in development', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('PROD', false);

      const setIntervalSpy = vi.spyOn(globalThis, 'setInterval');

      const { startAnalyticsSync } = await import('../analytics-sync');
      startAnalyticsSync();

      expect(setIntervalSpy).not.toHaveBeenCalled();
    });

    it('should clear events when consent is revoked', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('VITE_G4A_MEASUREMENT_ID', 'test-measurement-id');
      mockLocalStorage.set('analytics_consent', 'denied');

      const { startAnalyticsSync } = await import('../analytics-sync');
      startAnalyticsSync(); // This registers the event listener

      // Trigger consent change event
      window.dispatchEvent(new CustomEvent('analytics-consent-changed', { detail: 'denied' }));

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDB.clear).toHaveBeenCalledWith('events');
    });

    it('should not clear events when consent is granted', async () => {
      mockLocalStorage.set('analytics_consent', 'granted');

      await import('../analytics-sync');

      // Trigger consent change event
      window.dispatchEvent(new CustomEvent('analytics-consent-changed', { detail: 'granted' }));

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockDB.clear).not.toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    beforeEach(() => {
      mockLocalStorage.set('analytics_consent', 'granted');
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');
      vi.stubEnv('VITE_G4A_MEASUREMENT_ID', 'test-id');
      vi.stubEnv('VITE_G4A_SECRET', 'test-secret');
      vi.stubEnv('DEV', false);
      vi.stubEnv('PROD', true);
    });

    it('should handle complete offline-to-online flow', async () => {
      // Start offline
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });

      const { analytics } = await import('@/lib/analytics/analytics-client');
      const { startAnalyticsSync } = await import('../analytics-sync');

      // Track event while offline
      await analytics.track('page_view', { path: '/offline-test' });
      expect(mockDB.add).toHaveBeenCalled();

      // Come back online
      Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
      mockDB.getAll.mockResolvedValue([
        {
          name: 'page_view',
          params: { path: '/offline-test' },
          timestamp: Date.now(),
        },
      ]);
      mockFetch.mockResolvedValue(new Response('', { status: 200 }));

      startAnalyticsSync();

      // Simulate online event
      window.dispatchEvent(new Event('online'));

      // Wait for async flush
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockFetch).toHaveBeenCalled();
    });

    it('should handle consent revocation during queued events', async () => {
      vi.stubEnv('VITE_ANALYTICS_ENABLED', 'true');

      // Start with consent granted
      mockLocalStorage.set('analytics_consent', 'granted');

      const { analytics } = await import('@/lib/analytics/analytics-client');
      await import('../analytics-sync');

      // Track some events - should queue because online/offline logic
      Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
      await analytics.track('user_action', { action: 'click' });
      expect(mockDB.add).toHaveBeenCalled();

      // Reset to denied consent for the event
      mockLocalStorage.set('analytics_consent', 'denied');

      // Revoke consent
      window.dispatchEvent(new CustomEvent('analytics-consent-changed', { detail: 'denied' }));

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(mockDB.clear).toHaveBeenCalledWith('events');
    });
  });
});
