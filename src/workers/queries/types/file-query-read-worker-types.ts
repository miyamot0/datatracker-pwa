// Query type constants for type safety and extensibility
export const QUERY_TYPES = {
  FETCH_GROUPS: 'FETCH_GROUPS',
  FETCH_CLIENTS: 'FETCH_CLIENTS',
  FETCH_EVALUATIONS: 'FETCH_EVALUATIONS',
  FETCH_EVALUATIONS_ALL: 'FETCH_EVALUATIONS_ALL',
  FETCH_CONDITIONS: 'FETCH_CONDITIONS',
  FETCH_KEYSETS: 'FETCH_KEYSETS',
  FETCH_KEYSETS_ALL: 'FETCH_KEYSETS_ALL',
  FETCH_SESSIONS: 'FETCH_SESSIONS',
  FETCH_SESSION_PARAMS: 'FETCH_SESSION_PARAMS',
  FETCH_OUTCOMES: 'FETCH_OUTCOMES',
  FETCH_DIRECTORIES: 'FETCH_DIRECTORIES', // Generic directory fetcher
} as const;

export type QueryType = (typeof QUERY_TYPES)[keyof typeof QUERY_TYPES];

// Base interfaces for type safety
export interface BaseQueryRequest {
  id: string; // Unique ID for request tracking
  type: QueryType;
  timestamp?: number;
}

export interface BaseQueryResponse {
  id: string;
  success: boolean;
  timestamp: number;
  executionTime: number;
}

export interface SuccessResponse<T = unknown> extends BaseQueryResponse {
  success: true;
  data: T;
}

export interface ErrorResponse extends BaseQueryResponse {
  success: false;
  error: string;
  stack?: string;
}

export type QueryResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

// Specific query request types
export interface FetchGroupsRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_GROUPS;
  handle: FileSystemDirectoryHandle;
}

export interface FetchClientsRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_CLIENTS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
}

export interface FetchEvaluationsRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_EVALUATIONS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  clientName: string;
}

export interface FetchEvaluationsAllRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_EVALUATIONS_ALL;
  handle: FileSystemDirectoryHandle;
}

export interface FetchConditionsRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_CONDITIONS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationName: string;
}

export interface FetchKeysetsRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_KEYSETS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
}

export interface FetchKeysetsAllRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_KEYSETS_ALL;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
}

export interface FetchSessionParamsRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_SESSION_PARAMS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationName: string;
}

export interface FetchSessionOutcomesRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_OUTCOMES;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationName: string;
}

export interface FetchDirectoriesRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_DIRECTORIES;
  handle: FileSystemDirectoryHandle;
  path?: string[];
  filterPattern?: RegExp;
  excludeSystemFiles?: boolean;
}

export type QueryRequest =
  | FetchGroupsRequest
  | FetchClientsRequest
  | FetchEvaluationsRequest
  | FetchEvaluationsAllRequest
  | FetchConditionsRequest
  | FetchKeysetsRequest
  | FetchKeysetsAllRequest
  | FetchSessionParamsRequest
  | FetchSessionOutcomesRequest
  | FetchDirectoriesRequest;
