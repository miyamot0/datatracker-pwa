/**
 * Self-contained request/response types for the dedicated de-identify-individual worker.
 * Intentionally decoupled from `file-query-mutate-worker-types.ts` so this feature can be
 * developed, tested, and reasoned about in isolation from the shared generic mutation worker.
 */

export interface DeIdentifyIndividualRequest {
  id: string;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  sourceIndividualName: string;
  newIndividualName: string;
  birthYear: number;
  redactComments: boolean;
}

export interface DeIdentifyIndividualSuccessResponse {
  id: string;
  success: true;
  data: string[];
  timestamp: number;
  executionTime: number;
}

export interface DeIdentifyIndividualErrorResponse {
  id: string;
  success: false;
  error: string;
  stack?: string;
  timestamp: number;
  executionTime: number;
}

export type DeIdentifyIndividualResponse = DeIdentifyIndividualSuccessResponse | DeIdentifyIndividualErrorResponse;
