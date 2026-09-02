import { mutateDeIdentifyIndividual } from '../../lib/query-mutate';
import {
  DeIdentifyIndividualRequest,
  DeIdentifyIndividualResponse,
} from './types/deidentify-individual-worker-types';

/**
 * Dedicated worker for de-identifying a single individual. Kept separate from the generic
 * file-query-mutate-worker so this operation can be tested and reasoned about in isolation.
 */
self.onmessage = async (event: MessageEvent<DeIdentifyIndividualRequest>) => {
  const startTime = Date.now();
  const request = event.data;

  if (!request || !request.id) {
    const response: DeIdentifyIndividualResponse = {
      id: request?.id || 'unknown',
      success: false,
      error: 'Invalid request: missing id',
      timestamp: Date.now(),
      executionTime: Date.now() - startTime,
    };
    self.postMessage(response);
    return;
  }

  try {
    const data = await mutateDeIdentifyIndividual(
      request.handle,
      request.groupName,
      request.sourceIndividualName,
      request.newIndividualName,
      request.birthYear,
      request.redactComments,
    );

    const response: DeIdentifyIndividualResponse = {
      id: request.id,
      success: true,
      data,
      timestamp: Date.now(),
      executionTime: Date.now() - startTime,
    };
    self.postMessage(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const stack = error instanceof Error ? error.stack : undefined;

    const response: DeIdentifyIndividualResponse = {
      id: request.id,
      success: false,
      error: errorMessage,
      stack,
      timestamp: Date.now(),
      executionTime: Date.now() - startTime,
    };
    self.postMessage(response);
  }
};

export type { DeIdentifyIndividualRequest, DeIdentifyIndividualResponse };
