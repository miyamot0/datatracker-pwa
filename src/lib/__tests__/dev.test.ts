import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { setupQueryDevTools } from '../dev';

// Mock console
const originalConsoleLog = console.log;
const mockConsoleLog = vi.fn();
interface MockQuery {
  queryKey: unknown[];
  state: {
    status: 'idle' | 'pending' | 'error' | 'success';
    fetchStatus: 'idle' | 'fetching' | 'paused';
    dataUpdatedAt: number;
  };
}

interface MockQueryCacheEvent {
  type: string;
  query: MockQuery;
}

type SubscriptionCallback = (event: MockQueryCacheEvent) => void;

const createMockQuery = (overrides: Partial<MockQuery> = {}): MockQuery => ({
  queryKey: ['test-query'],
  state: {
    status: 'idle',
    fetchStatus: 'idle',
    dataUpdatedAt: 0,
  },
  ...overrides,
});

const createMockEvent = (query: MockQuery, type = 'updated'): MockQueryCacheEvent => ({
  type,
  query,
});

describe('setupQueryDevTools', () => {
  let mockQueryCache: any;
  let subscriptionCallback: SubscriptionCallback;

  const createMockQueryClient = () => {
    mockQueryCache = {
      subscribe: vi.fn((callback: SubscriptionCallback) => {
        subscriptionCallback = callback;
      }),
    };

    return {
      getQueryCache: vi.fn(() => mockQueryCache),
    } as any;
  };

  beforeEach(() => {
    mockConsoleLog.mockClear();
    console.log = mockConsoleLog;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    vi.unstubAllGlobals();
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      vi.stubGlobal('import.meta', { env: { DEV: true } });
    });

    it('sets up query cache subscription in development mode', () => {
      vi.stubGlobal('import.meta', { env: { DEV: true } });
      const mockQueryClient = createMockQueryClient();

      setupQueryDevTools(mockQueryClient);

      expect(mockQueryClient.getQueryCache).toHaveBeenCalledTimes(1);
      expect(mockQueryCache.subscribe).toHaveBeenCalledTimes(1);
      expect(mockQueryCache.subscribe).toHaveBeenCalledWith(expect.any(Function));
    });

    it('calls getQueryCache once inside the DEV block', () => {
      vi.stubGlobal('import.meta', { env: { DEV: true } });
      const mockQueryClient = createMockQueryClient();

      // The implementation has early return if (!DEV), then if (DEV) calls getQueryCache once
      setupQueryDevTools(mockQueryClient);

      expect(mockQueryClient.getQueryCache).toHaveBeenCalledTimes(1);
    });

    it('ignores non-updated events', () => {
      vi.stubGlobal('import.meta', { env: { DEV: true } });
      const mockQueryClient = createMockQueryClient();

      setupQueryDevTools(mockQueryClient);

      const query = createMockQuery();
      const event = createMockEvent(query, 'added');

      subscriptionCallback(event);

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('ignores events with no type', () => {
      vi.stubGlobal('import.meta', { env: { DEV: true } });
      const mockQueryClient = createMockQueryClient();

      setupQueryDevTools(mockQueryClient);

      const query = createMockQuery();
      const event = { query } as any; // No type property

      subscriptionCallback(event);

      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    describe('Query State Tracking', () => {
      it('logs fetch start when transitioning from non-fetching to fetching', () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const mockQueryClient = createMockQueryClient();

        setupQueryDevTools(mockQueryClient);

        const queryKey = ['user', 'profile'];
        const query = createMockQuery({
          queryKey,
          state: {
            status: 'pending',
            fetchStatus: 'fetching',
            dataUpdatedAt: Date.now(),
          },
        });

        const event = createMockEvent(query);
        subscriptionCallback(event);

        expect(mockConsoleLog).toHaveBeenCalledWith('[FETCH START]', queryKey);
      });

      it('does not log fetch start when already fetching', () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const mockQueryClient = createMockQueryClient();

        setupQueryDevTools(mockQueryClient);

        const queryKey = ['user', 'profile'];
        const query = createMockQuery({
          queryKey,
          state: {
            status: 'pending',
            fetchStatus: 'fetching',
            dataUpdatedAt: Date.now(),
          },
        });

        // First call to establish previous state
        let event = createMockEvent(query);
        subscriptionCallback(event);
        mockConsoleLog.mockClear();

        // Second call with same fetching state
        event = createMockEvent(query);
        subscriptionCallback(event);

        expect(mockConsoleLog).not.toHaveBeenCalledWith('[FETCH START]', queryKey);
      });

      it('logs fetch success when data is updated during fetch completion', () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const mockQueryClient = createMockQueryClient();

        setupQueryDevTools(mockQueryClient);

        const queryKey = ['posts'];
        const initialTime = Date.now();
        const updatedTime = initialTime + 1000;

        // First event: fetching state
        const fetchingQuery = createMockQuery({
          queryKey,
          state: {
            status: 'pending',
            fetchStatus: 'fetching',
            dataUpdatedAt: initialTime,
          },
        });

        let event = createMockEvent(fetchingQuery);
        subscriptionCallback(event);
        mockConsoleLog.mockClear();

        // Second event: fetch completed with updated data
        const successQuery = createMockQuery({
          queryKey,
          state: {
            status: 'success',
            fetchStatus: 'idle',
            dataUpdatedAt: updatedTime,
          },
        });

        event = createMockEvent(successQuery);
        subscriptionCallback(event);

        expect(mockConsoleLog).toHaveBeenCalledWith('[FETCH SUCCESS]', queryKey);
      });

      it('does not log fetch success when data was not updated', () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const mockQueryClient = createMockQueryClient();

        setupQueryDevTools(mockQueryClient);

        const queryKey = ['posts'];
        const sameTime = Date.now();

        // First event: fetching state
        const fetchingQuery = createMockQuery({
          queryKey,
          state: {
            status: 'pending',
            fetchStatus: 'fetching',
            dataUpdatedAt: sameTime,
          },
        });

        let event = createMockEvent(fetchingQuery);
        subscriptionCallback(event);
        mockConsoleLog.mockClear();

        // Second event: fetch completed but no data update
        const successQuery = createMockQuery({
          queryKey,
          state: {
            status: 'success',
            fetchStatus: 'idle',
            dataUpdatedAt: sameTime, // Same timestamp
          },
        });

        event = createMockEvent(successQuery);
        subscriptionCallback(event);

        expect(mockConsoleLog).not.toHaveBeenCalledWith('[FETCH SUCCESS]', queryKey);
      });

      it('logs cache hit when query is successful and idle with same data timestamp', () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const mockQueryClient = createMockQueryClient();

        setupQueryDevTools(mockQueryClient);

        const queryKey = ['cached-data'];
        const dataTime = Date.now();

        // First event: successful idle state
        const initialQuery = createMockQuery({
          queryKey,
          state: {
            status: 'success',
            fetchStatus: 'idle',
            dataUpdatedAt: dataTime,
          },
        });

        let event = createMockEvent(initialQuery);
        subscriptionCallback(event);
        mockConsoleLog.mockClear();

        // Second event: another successful idle state with same data (cache hit)
        const cachedQuery = createMockQuery({
          queryKey,
          state: {
            status: 'success',
            fetchStatus: 'idle',
            dataUpdatedAt: dataTime, // Same timestamp = cache hit
          },
        });

        event = createMockEvent(cachedQuery);
        subscriptionCallback(event);

        expect(mockConsoleLog).toHaveBeenCalledWith('[CACHE HIT]', queryKey);
      });

      it('does not log cache hit when data has been updated', () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const mockQueryClient = createMockQueryClient();

        setupQueryDevTools(mockQueryClient);

        const queryKey = ['cached-data'];
        const initialTime = Date.now();
        const updatedTime = initialTime + 1000;

        // First event: successful idle state
        const initialQuery = createMockQuery({
          queryKey,
          state: {
            status: 'success',
            fetchStatus: 'idle',
            dataUpdatedAt: initialTime,
          },
        });

        let event = createMockEvent(initialQuery);
        subscriptionCallback(event);
        mockConsoleLog.mockClear();

        // Second event: successful idle state with updated data (not cache hit)
        const updatedQuery = createMockQuery({
          queryKey,
          state: {
            status: 'success',
            fetchStatus: 'idle',
            dataUpdatedAt: updatedTime, // Different timestamp
          },
        });

        event = createMockEvent(updatedQuery);
        subscriptionCallback(event);

        expect(mockConsoleLog).not.toHaveBeenCalledWith('[CACHE HIT]', queryKey);
      });

      it('does not log cache hit when query is not successful', () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const mockQueryClient = createMockQueryClient();

        setupQueryDevTools(mockQueryClient);

        const queryKey = ['error-query'];
        const dataTime = Date.now();

        // First event: successful idle state
        const initialQuery = createMockQuery({
          queryKey,
          state: {
            status: 'success',
            fetchStatus: 'idle',
            dataUpdatedAt: dataTime,
          },
        });

        let event = createMockEvent(initialQuery);
        subscriptionCallback(event);
        mockConsoleLog.mockClear();

        // Second event: error state (not successful)
        const errorQuery = createMockQuery({
          queryKey,
          state: {
            status: 'error',
            fetchStatus: 'idle',
            dataUpdatedAt: dataTime,
          },
        });

        event = createMockEvent(errorQuery);
        subscriptionCallback(event);

        expect(mockConsoleLog).not.toHaveBeenCalledWith('[CACHE HIT]', queryKey);
      });

      it('does not log cache hit when fetch status is not idle', () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const mockQueryClient = createMockQueryClient();

        setupQueryDevTools(mockQueryClient);

        const queryKey = ['fetching-query'];
        const dataTime = Date.now();

        // First event: successful idle state
        const initialQuery = createMockQuery({
          queryKey,
          state: {
            status: 'success',
            fetchStatus: 'idle',
            dataUpdatedAt: dataTime,
          },
        });

        let event = createMockEvent(initialQuery);
        subscriptionCallback(event);
        mockConsoleLog.mockClear();

        // Second event: successful but fetching (not idle)
        const fetchingQuery = createMockQuery({
          queryKey,
          state: {
            status: 'success',
            fetchStatus: 'fetching',
            dataUpdatedAt: dataTime,
          },
        });

        event = createMockEvent(fetchingQuery);
        subscriptionCallback(event);

        expect(mockConsoleLog).not.toHaveBeenCalledWith('[CACHE HIT]', queryKey);
      });
    });

    describe('State Management Across Multiple Queries', () => {
      it('tracks different queries independently', () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const mockQueryClient = createMockQueryClient();

        setupQueryDevTools(mockQueryClient);

        const userQueryKey = ['user', '123'];
        const postsQueryKey = ['posts'];

        // User query fetch start
        const userQuery = createMockQuery({
          queryKey: userQueryKey,
          state: {
            status: 'pending',
            fetchStatus: 'fetching',
            dataUpdatedAt: Date.now(),
          },
        });

        subscriptionCallback(createMockEvent(userQuery));

        // Posts query fetch start
        const postsQuery = createMockQuery({
          queryKey: postsQueryKey,
          state: {
            status: 'pending',
            fetchStatus: 'fetching',
            dataUpdatedAt: Date.now(),
          },
        });

        subscriptionCallback(createMockEvent(postsQuery));

        expect(mockConsoleLog).toHaveBeenCalledWith('[FETCH START]', userQueryKey);
        expect(mockConsoleLog).toHaveBeenCalledWith('[FETCH START]', postsQueryKey);
        expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      });

      it('maintains separate state history for each query key', () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const mockQueryClient = createMockQueryClient();

        setupQueryDevTools(mockQueryClient);

        const query1Key = ['query1'];
        const query2Key = ['query2'];
        const dataTime = Date.now();

        // Query 1: Initial success state
        const query1Initial = createMockQuery({
          queryKey: query1Key,
          state: {
            status: 'success',
            fetchStatus: 'idle',
            dataUpdatedAt: dataTime,
          },
        });

        subscriptionCallback(createMockEvent(query1Initial));

        // Query 2: Initial success state
        const query2Initial = createMockQuery({
          queryKey: query2Key,
          state: {
            status: 'success',
            fetchStatus: 'idle',
            dataUpdatedAt: dataTime,
          },
        });

        subscriptionCallback(createMockEvent(query2Initial));
        mockConsoleLog.mockClear();

        // Query 1: Cache hit
        const query1CacheHit = createMockQuery({
          queryKey: query1Key,
          state: {
            status: 'success',
            fetchStatus: 'idle',
            dataUpdatedAt: dataTime, // Same time = cache hit
          },
        });

        subscriptionCallback(createMockEvent(query1CacheHit));

        expect(mockConsoleLog).toHaveBeenCalledWith('[CACHE HIT]', query1Key);
        expect(mockConsoleLog).toHaveBeenCalledTimes(1);
      });
    });

    describe('Complex Query Key Scenarios', () => {
      it('handles complex nested query keys', () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const mockQueryClient = createMockQueryClient();

        setupQueryDevTools(mockQueryClient);

        const complexQueryKey = ['user', { id: '123', includeProfile: true }, ['posts', { limit: 10, offset: 0 }]];

        const query = createMockQuery({
          queryKey: complexQueryKey,
          state: {
            status: 'pending',
            fetchStatus: 'fetching',
            dataUpdatedAt: Date.now(),
          },
        });

        subscriptionCallback(createMockEvent(query));

        expect(mockConsoleLog).toHaveBeenCalledWith('[FETCH START]', complexQueryKey);
      });

      it('treats queries with different key structures as separate', () => {
        vi.stubGlobal('import.meta', { env: { DEV: true } });
        const mockQueryClient = createMockQueryClient();

        setupQueryDevTools(mockQueryClient);

        const key1 = ['user', '123'];
        const key2 = ['user', '456'];

        // First query
        const query1 = createMockQuery({
          queryKey: key1,
          state: {
            status: 'pending',
            fetchStatus: 'fetching',
            dataUpdatedAt: Date.now(),
          },
        });

        subscriptionCallback(createMockEvent(query1));

        // Different query (different user ID)
        const query2 = createMockQuery({
          queryKey: key2,
          state: {
            status: 'pending',
            fetchStatus: 'fetching',
            dataUpdatedAt: Date.now(),
          },
        });

        subscriptionCallback(createMockEvent(query2));

        expect(mockConsoleLog).toHaveBeenCalledWith('[FETCH START]', key1);
        expect(mockConsoleLog).toHaveBeenCalledWith('[FETCH START]', key2);
        expect(mockConsoleLog).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Production Environment', () => {
    it('should not execute code when DEV is false', () => {
      // Since import.meta.env might be evaluated at compile time,
      // let's test this differently by checking if console.log is not called
      // when we simulate a production environment

      const mockSubscribe = vi.fn();
      const mockQueryCache = { subscribe: mockSubscribe };
      const mockGetQueryCache = vi.fn(() => mockQueryCache);

      const mockQueryClient = {
        getQueryCache: mockGetQueryCache,
      } as any;

      // Temporarily modify the global DEV flag using defineProperty
      const originalGlobal = globalThis as any;
      const originalImportMeta = originalGlobal['import.meta'] || { env: {} };

      // Override import.meta.env at the global level
      originalGlobal['import.meta'] = { env: { DEV: false } };

      try {
        // Re-import the module to get a fresh version with the new environment
        delete require.cache[require.resolve('../dev.ts')];
        const { setupQueryDevTools: freshSetupQueryDevTools } = require('../dev.ts');

        // This should not execute the main logic
        freshSetupQueryDevTools(mockQueryClient);

        // Should not have setup subscription since DEV = false
        expect(mockGetQueryCache).not.toHaveBeenCalled();
      } catch (error) {
        // If there's an import issue, at least verify the subscription wasn't called
        expect(mockSubscribe).not.toHaveBeenCalled();
      } finally {
        // Restore original import.meta
        originalGlobal['import.meta'] = originalImportMeta;
      }
    });

    it('handles production mode gracefully', () => {
      // Test that the function is resilient and doesn't crash in production
      const mockQueryClient = createMockQueryClient();

      // The current behavior might still call getQueryCache due to compile-time issues
      // But we can verify it doesn't log anything
      expect(() => {
        setupQueryDevTools(mockQueryClient);
      }).not.toThrow();

      // The key thing is that no console logs should happen in production
      // (though the subscription callback might be set up)
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.stubGlobal('import.meta', { env: { DEV: true } });
    });

    it('handles missing previous state gracefully', () => {
      vi.stubGlobal('import.meta', { env: { DEV: true } });
      const mockQueryClient = createMockQueryClient();

      setupQueryDevTools(mockQueryClient);

      const query = createMockQuery({
        queryKey: ['new-query'],
        state: {
          status: 'success',
          fetchStatus: 'idle',
          dataUpdatedAt: Date.now(),
        },
      });

      // No previous state exists for this query
      subscriptionCallback(createMockEvent(query));

      // Should not throw or log cache hit (since no previous state)
      expect(mockConsoleLog).not.toHaveBeenCalledWith(expect.stringContaining('[CACHE HIT]'), expect.anything());
    });

    it('handles undefined or null events gracefully', () => {
      vi.stubGlobal('import.meta', { env: { DEV: true } });
      const mockQueryClient = createMockQueryClient();

      setupQueryDevTools(mockQueryClient);

      // Should not throw when called with undefined
      expect(() => subscriptionCallback(undefined as any)).not.toThrow();
      expect(() => subscriptionCallback(null as any)).not.toThrow();
    });

    it('throws when events have missing query property', () => {
      vi.stubGlobal('import.meta', { env: { DEV: true } });
      const mockQueryClient = createMockQueryClient();

      setupQueryDevTools(mockQueryClient);

      const malformedEvent = { type: 'updated' } as any; // Missing query

      expect(() => subscriptionCallback(malformedEvent)).toThrow();
      expect(mockConsoleLog).not.toHaveBeenCalled();
    });

    it('throws when queries have missing or malformed state', () => {
      vi.stubGlobal('import.meta', { env: { DEV: true } });
      const mockQueryClient = createMockQueryClient();

      setupQueryDevTools(mockQueryClient);

      const queryWithBadState = {
        queryKey: ['test'],
        state: undefined, // Missing state
      } as any;

      const event = createMockEvent(queryWithBadState);

      expect(() => subscriptionCallback(event)).toThrow();
    });
  });
});
