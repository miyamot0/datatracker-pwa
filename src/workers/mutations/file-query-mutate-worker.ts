import { CleanUpString } from '@/lib/strings';

// Mutation type constants for type safety and extensibility
const MUTATION_TYPES = {
  MUTATE_CONDITIONS: 'MUTATE_CONDITIONS',
} as const;

type MutationType = (typeof MUTATION_TYPES)[keyof typeof MUTATION_TYPES];

// Base interfaces for type safety
interface BaseMutationRequest {
  id: string; // Unique ID for request tracking
  type: MutationType;
  timestamp?: number;
}

interface BaseMutationResponse {
  id: string;
  success: boolean;
  timestamp: number;
  executionTime: number;
}

interface SuccessResponse<T = any> extends BaseMutationResponse {
  success: true;
  data: T;
}

interface ErrorResponse extends BaseMutationResponse {
  success: false;
  error: string;
  stack?: string;
}

type MutationResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Specific mutation request types
interface MutateConditionsRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_CONDITIONS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationName: string;
  conditionName?: string;
  action: 'Add' | 'Clear';
}

type MutationRequest = MutateConditionsRequest;

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
): MutationResponse<T> {
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

// Core mutation handlers
async function mutateConditions(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  evaluationName: string,
  action: 'Add' | 'Clear',
  conditionName?: string,
): Promise<string[]> {
  try {
    const group_dir = await handle.getDirectoryHandle(CleanUpString(groupName));
    const individual_dir = await group_dir.getDirectoryHandle(CleanUpString(individualName));
    const evaluation_dir = await individual_dir.getDirectoryHandle(CleanUpString(evaluationName));

    // First, get current conditions list
    const conditions: string[] = [];
    for await (const [name, entry] of evaluation_dir.entries()) {
      if (entry.kind === 'directory' && name !== '.DS_Store') {
        conditions.push(name);
      }
    }

    let newConditionsList = [...conditions];

    switch (action) {
      case 'Add':
        if (!conditionName) {
          throw new Error('Condition name is required for Add action');
        }

        await evaluation_dir.getDirectoryHandle(conditionName, { create: true });

        if (!newConditionsList.includes(conditionName)) {
          newConditionsList.push(conditionName);
        }

        break;

      case 'Clear': {
        for await (const [entryName, entry] of evaluation_dir.entries()) {
          if (entry.kind === 'directory' && entryName !== '.DS_Store') {
            const conditionDir = await evaluation_dir.getDirectoryHandle(entryName);
            const entriesInCondition = await conditionDir.values();

            let fileCount = 0;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const _ of entriesInCondition) {
              fileCount = fileCount + 1;
            }

            if (fileCount === 0) {
              await evaluation_dir.removeEntry(entryName, { recursive: true });
              newConditionsList = newConditionsList.filter((cond) => cond !== entryName);
            }
          }
        }
        break;
      }
    }

    return newConditionsList;
  } catch (error) {
    console.error('Error mutating conditions:', error);
    throw error;
  }
}

// Mutation dispatcher - maps mutation types to handlers
const mutationHandlers: Record<MutationType, (request: any) => Promise<any>> = {
  [MUTATION_TYPES.MUTATE_CONDITIONS]: (req: MutateConditionsRequest) =>
    mutateConditions(req.handle, req.groupName, req.individualName, req.evaluationName, req.action, req.conditionName),
};

// Main message handler
self.onmessage = async (event: MessageEvent<MutationRequest>) => {
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
    const handler = mutationHandlers[request.type];
    if (!handler) {
      throw new Error(`Unsupported mutation type: ${request.type}`);
    }

    // Execute the mutation
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
  MutationType,
  MutationRequest,
  MutationResponse,
  SuccessResponse,
  ErrorResponse,
  BaseMutationResponse,
  MutateConditionsRequest,
  CreateResponseFunction,
};

export { MUTATION_TYPES, createResponse };
