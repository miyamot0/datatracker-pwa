import {
  QUERY_TYPES,
  QueryType,
  QueryRequest,
  QueryResponse,
  SuccessResponse,
  ErrorResponse,
  FetchGroupsRequest,
  FetchClientsRequest,
  FetchEvaluationsRequest,
  FetchEvaluationsAllRequest,
  FetchConditionsRequest,
  FetchKeysetsRequest,
  FetchKeysetsAllRequest,
  FetchSessionParamsRequest,
  FetchSessionOutcomesRequest,
  FetchDirectoriesRequest,
} from './types/file-query-read-worker-types';
import {
  fetchDirectories,
  fetchGroups,
  fetchClients,
  fetchEvaluations,
  fetchEvaluationsAll,
  fetchConditions,
  fetchKeysets,
  fetchKeysetsAll,
  fetchSessionParams,
  fetchSessionOutcomes,
} from '../../lib/query-read';

// Type-safe createResponse function with overloads
function createResponse<T>(id: string, startTime: number, success: true, data: T): SuccessResponse<T>;

function createResponse(
  id: string,
  startTime: number,
  success: false,
  data: undefined,
  error: string,
  stack?: string,
): ErrorResponse;

function createResponse<T>(
  id: string,
  startTime: number,
  success: boolean,
  data?: T,
  error?: string,
  stack?: string,
): QueryResponse<T> {
  const timestamp = Date.now();
  const executionTime = timestamp - startTime;

  if (success) {
    return {
      id,
      success: true,
      data: data!,
      timestamp,
      executionTime,
    } as SuccessResponse<T>;
  } else {
    return {
      id,
      success: false,
      error: error!,
      stack,
      timestamp,
      executionTime,
    } as ErrorResponse;
  }
}

// Type alias for the createResponse function
type CreateResponseFunction = typeof createResponse;

// Query dispatcher - maps query types to handlers
const queryHandlers: Record<QueryType, (request: unknown) => Promise<unknown>> = {
  [QUERY_TYPES.FETCH_GROUPS]: (req: unknown) => fetchGroups((req as FetchGroupsRequest).handle),

  [QUERY_TYPES.FETCH_CLIENTS]: (req: unknown) => {
    const request = req as FetchClientsRequest;
    return fetchClients(request.handle, request.groupName);
  },

  [QUERY_TYPES.FETCH_EVALUATIONS]: (req: unknown) => {
    const request = req as FetchEvaluationsRequest;
    return fetchEvaluations(request.handle, request.groupName, request.clientName);
  },

  [QUERY_TYPES.FETCH_EVALUATIONS_ALL]: (req: unknown) =>
    fetchEvaluationsAll((req as FetchEvaluationsAllRequest).handle),

  [QUERY_TYPES.FETCH_CONDITIONS]: (req: unknown) => {
    const request = req as FetchConditionsRequest;
    return fetchConditions(request.handle, request.groupName, request.individualName, request.evaluationName);
  },

  [QUERY_TYPES.FETCH_KEYSETS]: (req: unknown) => {
    const request = req as FetchKeysetsRequest;
    return fetchKeysets(request.handle, request.groupName, request.individualName);
  },

  [QUERY_TYPES.FETCH_KEYSETS_ALL]: (req: unknown) => {
    const request = req as FetchKeysetsAllRequest;
    return fetchKeysetsAll(request.handle, request.groupName, request.individualName);
  },

  [QUERY_TYPES.FETCH_SESSION_PARAMS]: (req: unknown) => {
    const request = req as FetchSessionParamsRequest;
    return fetchSessionParams(request.handle, request.groupName, request.individualName, request.evaluationName);
  },

  [QUERY_TYPES.FETCH_SESSIONS]: (req: unknown) => {
    const request = req as FetchDirectoriesRequest;
    return fetchDirectories(request.handle, {
      path: request.path,
      filterPattern: request.filterPattern,
      excludeSystemFiles: request.excludeSystemFiles,
    });
  },

  [QUERY_TYPES.FETCH_OUTCOMES]: (req: unknown) => {
    const request = req as FetchSessionOutcomesRequest;
    return fetchSessionOutcomes(request.handle, request.groupName, request.individualName, request.evaluationName);
  },

  [QUERY_TYPES.FETCH_DIRECTORIES]: (req: unknown) => {
    const request = req as FetchDirectoriesRequest;
    return fetchDirectories(request.handle, {
      path: request.path,
      filterPattern: request.filterPattern,
      excludeSystemFiles: request.excludeSystemFiles,
    });
  },
};

// Main message handler
self.onmessage = async (event: MessageEvent<QueryRequest>) => {
  const startTime = Date.now();
  const request = event.data;

  // Validate request structure
  if (!request || !request.id || !request.type) {
    const response = createResponse(
      request?.id || 'unknown',
      startTime,
      false,
      undefined,
      'Invalid request: missing id or type',
    );
    self.postMessage(response);
    return;
  }

  try {
    // Get the appropriate handler
    const handler = queryHandlers[request.type];
    if (!handler) {
      throw new Error(`Unsupported query type: ${request.type}`);
    }

    // Execute the query
    const result = await handler(request);

    // Send success response
    const response = createResponse(request.id, startTime, true, result);
    self.postMessage(response);
  } catch (error) {
    // Send error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const stack = error instanceof Error ? error.stack : undefined;

    const response = createResponse(request.id, startTime, false, undefined, errorMessage, stack);
    self.postMessage(response);
  }
};

// Export types and functions for main thread usage (if using TypeScript modules)
export type { CreateResponseFunction };

export { createResponse };
