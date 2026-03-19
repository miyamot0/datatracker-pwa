import { deserializeKeySet } from '@/lib/keyset';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';
import { DEFAULT_SESSION_SETTINGS, SavedSettings, SavedSessionResult } from '@/lib/dtos';
import { ModifiedSessionResult } from '@/types/storage';

// Query type constants for type safety and extensibility
const QUERY_TYPES = {
  FETCH_GROUPS: 'FETCH_GROUPS',
  FETCH_CLIENTS: 'FETCH_CLIENTS',
  FETCH_EVALUATIONS: 'FETCH_EVALUATIONS',
  FETCH_CONDITIONS: 'FETCH_CONDITIONS',
  FETCH_KEYSETS: 'FETCH_KEYSETS',
  FETCH_SESSIONS: 'FETCH_SESSIONS',
  FETCH_SESSION_PARAMS: 'FETCH_SESSION_PARAMS',
  FETCH_OUTCOMES: 'FETCH_OUTCOMES',
  FETCH_DIRECTORIES: 'FETCH_DIRECTORIES', // Generic directory fetcher
} as const;

type QueryType = (typeof QUERY_TYPES)[keyof typeof QUERY_TYPES];

// Base interfaces for type safety
interface BaseQueryRequest {
  id: string; // Unique ID for request tracking
  type: QueryType;
  timestamp?: number;
}

interface BaseQueryResponse {
  id: string;
  success: boolean;
  timestamp: number;
  executionTime: number;
}

interface SuccessResponse<T = any> extends BaseQueryResponse {
  success: true;
  data: T;
}

interface ErrorResponse extends BaseQueryResponse {
  success: false;
  error: string;
  stack?: string;
}

type QueryResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Specific query request types
interface FetchGroupsRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_GROUPS;
  handle: FileSystemDirectoryHandle;
}

interface FetchClientsRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_CLIENTS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
}

interface FetchEvaluationsRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_EVALUATIONS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  clientName: string;
}

interface FetchConditionsRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_CONDITIONS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationName: string;
}

interface FetchKeysetsRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_KEYSETS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
}

interface FetchSessionParamsRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_SESSION_PARAMS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationName: string;
}

interface FetchSessionOutcomesRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_OUTCOMES;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationName: string;
}

interface FetchDirectoriesRequest extends BaseQueryRequest {
  type: typeof QUERY_TYPES.FETCH_DIRECTORIES;
  handle: FileSystemDirectoryHandle;
  path?: string[];
  filterPattern?: RegExp;
  excludeSystemFiles?: boolean;
}

type QueryRequest =
  | FetchGroupsRequest
  | FetchClientsRequest
  | FetchEvaluationsRequest
  | FetchConditionsRequest
  | FetchKeysetsRequest
  | FetchSessionParamsRequest
  | FetchSessionOutcomesRequest
  | FetchDirectoriesRequest;

// Utility functions
const isSystemFile = (name: string): boolean => {
  return name.startsWith('.') || ['Thumbs.db', 'desktop.ini'].includes(name);
};

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

// Core query handlers
async function fetchDirectories(
  handle: FileSystemDirectoryHandle,
  options?: {
    path?: string[];
    filterPattern?: RegExp;
    excludeSystemFiles?: boolean;
  },
): Promise<string[]> {
  const { path = [], filterPattern, excludeSystemFiles = true } = options || {};

  let currentHandle = handle;

  // Navigate to the specified path
  for (const segment of path) {
    try {
      currentHandle = await currentHandle.getDirectoryHandle(segment);
    } catch {
      return []; // Path doesn't exist
    }
  }

  const directories: string[] = [];

  try {
    for await (const [name, entry] of currentHandle.entries()) {
      if (entry.kind !== 'directory') continue;

      if (excludeSystemFiles && isSystemFile(name)) continue;

      if (filterPattern && !filterPattern.test(name)) continue;

      directories.push(name);
    }

    return directories.sort(); // Return sorted for consistency
  } catch (error) {
    console.error('Error fetching directories:', error);
    return [];
  }
}

async function fetchGroups(handle: FileSystemDirectoryHandle): Promise<string[]> {
  return fetchDirectories(handle, { excludeSystemFiles: true });
}

async function fetchClients(handle: FileSystemDirectoryHandle, groupName: string): Promise<string[]> {
  return fetchDirectories(handle, {
    path: [groupName],
    excludeSystemFiles: true,
  });
}

async function fetchEvaluations(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  clientName?: string,
): Promise<string[]> {
  const path = clientName ? [groupName, clientName] : [groupName];
  return fetchDirectories(handle, {
    path,
    excludeSystemFiles: true,
  });
}

async function fetchConditions(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  evaluationName: string,
): Promise<string[]> {
  const conditions: string[] = [];

  try {
    const group_folder = await handle.getDirectoryHandle(CleanUpString(groupName));
    const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(individualName));
    const evaluations = await individual_folder.getDirectoryHandle(CleanUpString(evaluationName));

    for await (const [name, entry] of evaluations.entries()) {
      if (entry.kind === 'directory' && name !== '.DS_Store') {
        conditions.push(name);
      }
    }

    return conditions;
  } catch (error) {
    console.error('Error fetching conditions:', error);
    return [];
  }
}

async function fetchKeysets(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
): Promise<KeySet[]> {
  const keysets: KeySet[] = [];

  try {
    const individuals_folder = await handle.getDirectoryHandle(CleanUpString(groupName), { create: true });
    const keyboards_folder = await individuals_folder.getDirectoryHandle(CleanUpString(individualName), {
      create: true,
    });

    for await (const [name, entry] of keyboards_folder.entries()) {
      if (name === '.DS_Store') continue;

      if (entry.kind === 'file' && name.endsWith('.json')) {
        const keyset = await entry.getFile();
        const keyset_text = await keyset.text();

        if (keyset_text.length === 0) continue;

        const keyset_json = deserializeKeySet(keyset_text);

        if (keyset_json) {
          keysets.push(keyset_json);
        }
      }
    }

    return keysets;
  } catch (error) {
    console.error('Error fetching keysets:', error);
    return [];
  }
}

async function fetchSessionParams(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  evaluationName: string,
): Promise<SavedSettings> {
  try {
    const group_folder = await handle.getDirectoryHandle(CleanUpString(groupName));
    const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(individualName));
    const evaluations = await individual_folder.getDirectoryHandle(CleanUpString(evaluationName));

    try {
      const settings_file = await evaluations.getFileHandle('settings.json');
      const settings = await settings_file.getFile();
      const settings_text = await settings.text();
      const settings_json = JSON.parse(settings_text) as SavedSettings;

      if (!settings_json) throw new Error('Settings file not well-formed');

      return settings_json;
    } catch (error) {
      // Create default settings file if not found
      try {
        const file = await evaluations.getFileHandle('settings.json', { create: true });
        const writer = await file.createWritable();
        await writer.write(JSON.stringify(DEFAULT_SESSION_SETTINGS));
        await writer.close();
      } catch (writeError) {
        console.error('Error creating default settings file:', writeError);
      }

      return DEFAULT_SESSION_SETTINGS;
    }
  } catch (error) {
    console.error('Error fetching session params:', error);
    return DEFAULT_SESSION_SETTINGS;
  }
}

async function fetchSessionOutcomes(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  evaluationName: string,
): Promise<ModifiedSessionResult[]> {
  try {
    const group_folder = await handle.getDirectoryHandle(CleanUpString(groupName));
    const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(individualName));
    const evaluations = await individual_folder.getDirectoryHandle(CleanUpString(evaluationName));

    const files: FileSystemFileHandle[] = [];

    for await (const [name, entry] of evaluations.entries()) {
      if (name === '.DS_Store') continue;

      if (entry.kind === 'file' && name.endsWith('.json')) {
        // Skip the settings file
        if (name === 'settings.json') continue;
        files.push(entry);
      } else if (entry.kind === 'directory') {
        const condition_folder = await evaluations.getDirectoryHandle(name);

        for await (const [conditionName, condition_entry] of condition_folder.entries()) {
          if (condition_entry.kind === 'file' && conditionName.endsWith('.json')) {
            files.push(condition_entry);
          }
        }
      }
    }

    const session_results: ModifiedSessionResult[] = [];

    for (const file of files) {
      try {
        const file_data = await file.getFile();
        const file_text = await file_data.text();

        const session_result: ModifiedSessionResult = {
          ...(JSON.parse(file_text) as SavedSessionResult),
          Filename: file.name,
        };

        if (session_result) {
          session_results.push(session_result);
        }
      } catch (error) {
        console.error(`Error parsing session outcome file ${file.name}:`, error);
      }
    }

    return session_results.sort(
      (a, b) => new Date(b.SessionSettings.Session).valueOf() - new Date(a.SessionSettings.Session).valueOf(),
    );
  } catch (error) {
    console.error('Error fetching session outcomes:', error);
    return [];
  }
}

// Query dispatcher - maps query types to handlers
const queryHandlers: Record<QueryType, (request: any) => Promise<any>> = {
  [QUERY_TYPES.FETCH_GROUPS]: (req: FetchGroupsRequest) => fetchGroups(req.handle),

  [QUERY_TYPES.FETCH_CLIENTS]: (req: FetchClientsRequest) => fetchClients(req.handle, req.groupName),

  [QUERY_TYPES.FETCH_EVALUATIONS]: (req: FetchEvaluationsRequest) =>
    fetchEvaluations(req.handle, req.groupName, req.clientName),

  [QUERY_TYPES.FETCH_CONDITIONS]: (req: FetchConditionsRequest) =>
    fetchConditions(req.handle, req.groupName, req.individualName, req.evaluationName),

  [QUERY_TYPES.FETCH_KEYSETS]: (req: FetchKeysetsRequest) =>
    fetchKeysets(req.handle, req.groupName, req.individualName),

  [QUERY_TYPES.FETCH_SESSION_PARAMS]: (req: FetchSessionParamsRequest) =>
    fetchSessionParams(req.handle, req.groupName, req.individualName, req.evaluationName),

  [QUERY_TYPES.FETCH_SESSIONS]: (req: FetchDirectoriesRequest) =>
    fetchDirectories(req.handle, {
      path: req.path,
      filterPattern: req.filterPattern,
      excludeSystemFiles: req.excludeSystemFiles,
    }),

  [QUERY_TYPES.FETCH_OUTCOMES]: (req: FetchSessionOutcomesRequest) =>
    fetchSessionOutcomes(req.handle, req.groupName, req.individualName, req.evaluationName),

  [QUERY_TYPES.FETCH_DIRECTORIES]: (req: FetchDirectoriesRequest) =>
    fetchDirectories(req.handle, {
      path: req.path,
      filterPattern: req.filterPattern,
      excludeSystemFiles: req.excludeSystemFiles,
    }),
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

// Export types for main thread usage (if using TypeScript modules)
export type {
  QueryType,
  QueryRequest,
  QueryResponse,
  SuccessResponse,
  ErrorResponse,
  BaseQueryResponse,
  FetchGroupsRequest,
  FetchClientsRequest,
  FetchEvaluationsRequest,
  FetchConditionsRequest,
  FetchKeysetsRequest,
  FetchSessionParamsRequest,
  FetchSessionOutcomesRequest,
  FetchDirectoriesRequest,
  CreateResponseFunction,
};

export { QUERY_TYPES, createResponse };
