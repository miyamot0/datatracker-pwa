import {
  MUTATION_TYPES,
  MutationType,
  MutationRequest,
  MutationResponse,
  SuccessResponse,
  ErrorResponse,
  BaseMutationResponse,
  MutateConditionsRequest,
  MutateEvaluationsRequest,
  MutateEvaluationsAllRequest,
  MutateGroupsRequest,
  MutateIndividualsRequest,
  MutateKeysetsRequest,
  MutateKeysetsAllRequest,
  MutateSessionOutcomesRequest,
  MutateSessionParamsRequest,
} from './types/file-query-mutate-worker-types';
import {
  mutateConditions,
  mutateEvaluations,
  mutateEvaluationsAll,
  mutateGroups,
  mutateIndividuals,
  mutateKeysets,
  mutateKeysetsAll,
  mutateSessionOutcomes,
  mutateSessionParams,
} from './helpers/file-query-mutate-actions';

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

type CreateResponseFunction = typeof createResponse;

const mutationHandlers: Record<MutationType, (request: any) => Promise<any>> = {
  [MUTATION_TYPES.MUTATE_CONDITIONS]: (req: MutateConditionsRequest) =>
    mutateConditions(req.handle, req.groupName, req.individualName, req.evaluationName, req.action, req.conditionName),

  [MUTATION_TYPES.MUTATE_EVALUATIONS]: (req: MutateEvaluationsRequest) =>
    mutateEvaluations(req.handle, req.groupName, req.individualName, req.evaluationNames, req.action, req.renameTo),

  [MUTATION_TYPES.MUTATE_EVALUATIONS_ALL]: (req: MutateEvaluationsAllRequest) =>
    mutateEvaluationsAll(
      req.handle,
      req.groupName,
      req.individualName,
      req.action,
      req.allRecords,
      req.relevantRecords,
    ),

  [MUTATION_TYPES.MUTATE_GROUPS]: (req: MutateGroupsRequest) => mutateGroups(req.handle, req.groupNames, req.action),

  [MUTATION_TYPES.MUTATE_INDIVIDUALS]: (req: MutateIndividualsRequest) =>
    mutateIndividuals(req.handle, req.groupName, req.individualNames, req.action),

  [MUTATION_TYPES.MUTATE_KEYSETS]: (req: MutateKeysetsRequest) =>
    mutateKeysets(
      req.handle,
      req.groupName,
      req.individualName,
      req.keysetNames,
      req.action,
      req.renameTo,
      req.newKeySet,
    ),

  [MUTATION_TYPES.MUTATE_KEYSETS_ALL]: (req: MutateKeysetsAllRequest) =>
    mutateKeysetsAll(req.handle, req.groupName, req.individualName, req.keySets, req.allKeySets),

  [MUTATION_TYPES.MUTATE_SESSION_OUTCOMES]: (req: MutateSessionOutcomesRequest) =>
    mutateSessionOutcomes(
      req.handle,
      req.groupName,
      req.individualName,
      req.evaluationName,
      req.outcomes,
      req.sessionOutcomes,
      req.action,
      req.conditionRename,
      req.updatedOutcome,
      req.priorOutcome,
      req.newOutcome,
    ),

  [MUTATION_TYPES.MUTATE_SESSION_PARAMS]: (req: MutateSessionParamsRequest) =>
    mutateSessionParams(req.handle, req.groupName, req.individualName, req.evaluationName, req.settings),
};

self.onmessage = async (event: MessageEvent<MutationRequest>) => {
  const startTime = Date.now();
  const request = event.data;

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
    const handler = mutationHandlers[request.type];

    if (!handler) {
      throw new Error(`Unsupported mutation type: ${request.type}`);
    }

    const result = await handler(request);

    const response = createResponse(request.id, startTime, true, result);
    self.postMessage(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const stack = error instanceof Error ? error.stack : undefined;

    const response = createResponse(request.id, startTime, false, undefined, errorMessage, stack);
    self.postMessage(response);
  }
};

export type {
  MutationType,
  MutationRequest,
  MutationResponse,
  SuccessResponse,
  ErrorResponse,
  BaseMutationResponse,
  MutateConditionsRequest,
  MutateEvaluationsRequest,
  MutateEvaluationsAllRequest,
  MutateGroupsRequest,
  MutateIndividualsRequest,
  MutateKeysetsRequest,
  MutateKeysetsAllRequest,
  MutateSessionOutcomesRequest,
  MutateSessionParamsRequest,
  CreateResponseFunction,
};

export { MUTATION_TYPES, createResponse };
