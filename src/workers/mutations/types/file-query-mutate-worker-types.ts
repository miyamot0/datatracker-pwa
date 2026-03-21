import { KeySet, KeySetExtended } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';
import { SavedSessionResult, SavedSettings } from '@/lib/dtos';
import { EvaluationRecord } from '@/queries/keysets/types/evaluation-record';

export const MUTATION_TYPES = {
  MUTATE_CONDITIONS: 'MUTATE_CONDITIONS',
  MUTATE_EVALUATIONS: 'MUTATE_EVALUATIONS',
  MUTATE_EVALUATIONS_ALL: 'MUTATE_EVALUATIONS_ALL',
  MUTATE_GROUPS: 'MUTATE_GROUPS',
  MUTATE_INDIVIDUALS: 'MUTATE_INDIVIDUALS',
  MUTATE_KEYSETS: 'MUTATE_KEYSETS',
  MUTATE_KEYSETS_ALL: 'MUTATE_KEYSETS_ALL',
  MUTATE_SESSION_OUTCOMES: 'MUTATE_SESSION_OUTCOMES',
  MUTATE_SESSION_PARAMS: 'MUTATE_SESSION_PARAMS',
} as const;

export type MutationType = (typeof MUTATION_TYPES)[keyof typeof MUTATION_TYPES];

export interface BaseMutationRequest {
  id: string;
  type: MutationType;
  timestamp?: number;
}

export interface BaseMutationResponse {
  id: string;
  success: boolean;
  timestamp: number;
  executionTime: number;
}

export interface SuccessResponse<T = any> extends BaseMutationResponse {
  success: true;
  data: T;
}

export interface ErrorResponse extends BaseMutationResponse {
  success: false;
  error: string;
  stack?: string;
}

export type MutationResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export interface MutateConditionsRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_CONDITIONS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationName: string;
  conditionName?: string;
  action: 'Add' | 'Clear';
}

export interface MutateEvaluationsRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_EVALUATIONS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationNames: string[];
  renameTo?: string;
  action: 'Add' | 'Delete' | 'Duplicate' | 'Rename';
}

export interface MutateEvaluationsAllRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_EVALUATIONS_ALL;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  relevantRecords?: EvaluationRecord[];
  allRecords: EvaluationRecord[];
  action: 'Import';
}

export interface MutateGroupsRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_GROUPS;
  handle: FileSystemDirectoryHandle;
  groupNames: string[];
  action: 'Add' | 'Delete' | 'Demo';
}

export interface MutateIndividualsRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_INDIVIDUALS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualNames: string[];
  action: 'Add' | 'Delete';
}

export interface MutateKeysetsRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_KEYSETS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  keysetNames: string[];
  renameTo?: string;
  newKeySet?: KeySet;
  action: 'Add' | 'Delete' | 'Duplicate' | 'Rename' | 'Update';
}

export interface MutateKeysetsAllRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_KEYSETS_ALL;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  keySets: KeySet[];
  allKeySets: KeySetExtended[];
}

export interface MutateSessionOutcomesRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_SESSION_OUTCOMES;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationName: string;
  outcomes: ModifiedSessionResult[];
  sessionOutcomes: ModifiedSessionResult[];
  conditionRename?: string;
  updatedOutcome?: ModifiedSessionResult;
  priorOutcome?: ModifiedSessionResult;
  newOutcome?: SavedSessionResult;
  action: 'Delete' | 'EditCondition' | 'Modify' | 'Add';
}

export interface MutateSessionParamsRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_SESSION_PARAMS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationName: string;
  settings: SavedSettings;
}

export type MutationRequest =
  | MutateConditionsRequest
  | MutateEvaluationsRequest
  | MutateEvaluationsAllRequest
  | MutateGroupsRequest
  | MutateIndividualsRequest
  | MutateKeysetsRequest
  | MutateKeysetsAllRequest
  | MutateSessionOutcomesRequest
  | MutateSessionParamsRequest;
