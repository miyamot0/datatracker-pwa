import { QueryClient } from '@tanstack/react-query';

/**
 * Sets up development tools for React Query by subscribing to the query cache and logging query events. This function is intended to be used in development mode to help developers understand the behavior of their queries, including when they start fetching, when they successfully fetch data, and when they hit the cache. By logging these events, developers can gain insights into the performance and efficiency of their queries, making it easier to debug and optimize their applications during development.
 * @param queryClient - The QueryClient instance from React Query that manages the query cache and state. This client is used to subscribe to query events and log relevant information about the queries being executed in the application.
 *
 */
export const setupQueryDevTools = (queryClient: QueryClient) => {
  if (!import.meta.env.DEV) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prevStates = new Map<string, any>();

  queryClient.getQueryCache().subscribe((event) => {
    if (event?.type !== 'updated') return;

    const query = event.query;
    const key = JSON.stringify(query.queryKey);

    const prev = prevStates.get(key);
    const curr = query.state;

    if (curr.fetchStatus === 'fetching' && prev?.fetchStatus !== 'fetching') {
      console.log('[FETCH START]', query.queryKey);
    }

    if (prev && curr.dataUpdatedAt !== prev.dataUpdatedAt && prev.fetchStatus === 'fetching') {
      console.log('[FETCH SUCCESS]', query.queryKey);
    }

    if (
      curr.status === 'success' &&
      curr.fetchStatus === 'idle' &&
      prev &&
      prev.fetchStatus === 'idle' &&
      curr.dataUpdatedAt === prev.dataUpdatedAt
    ) {
      console.log('[CACHE HIT]', query.queryKey);
    }

    prevStates.set(key, curr);
  });
};
