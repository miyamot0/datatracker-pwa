import { MutateEvaluationsAllRequest, MutationResponse } from '@/workers/mutations/file-query-mutate-worker';
import { EvaluationRecord } from '../keysets/types/evaluation-record';
import { evaluationsAllQueryOptions } from './query-evaluations-all';
import GenericFileWorker from '@/workers/mutations/file-query-mutate-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';
import { queryClient } from '@/App';

/**
 * This function is responsible for mutating the evaluations associated with a specific group and individual. It takes in the necessary parameters to identify the target evaluations and the action to be performed (in this case, importing evaluations). The function first retrieves the current list of evaluations using React Query's `fetchQuery` method. It then performs the specified action by iterating over the relevant evaluation records and duplicating them in the file system using the provided directory handle. Finally, it returns the updated list of evaluation records after the mutation is complete.
 *
 * @param Group - The name of the group associated with the evaluations.
 * @param Individual - The name of the individual associated with the evaluations.
 * @param RelevantRecords - An optional array of evaluation records that are relevant to the mutation action (in this case, the evaluations to be imported).
 * @param Handle - The file system directory handle used to access and manipulate the evaluation records.
 * @param Action - The action to be performed on the evaluations (in this case, 'Import').
 * @returns - A promise that resolves to the updated list of evaluation records after the mutation is complete.
 */
export const mutationEvaluationsAll = async ({
  Group,
  Individual,
  RelevantRecords,
  Handle,
  Action,
}: {
  Group: string;
  Individual: string;
  RelevantRecords?: EvaluationRecord[];
  Handle: FileSystemDirectoryHandle;
  Action: 'Import';
}): Promise<EvaluationRecord[]> => {
  const evaluationsAll: EvaluationRecord[] = await queryClient.fetchQuery(evaluationsAllQueryOptions(Handle));

  if (!evaluationsAll) {
    throw new Error('Evaluations not found');
  }

  return await mutationEvaluationsAllWorker({
    Group,
    Individual,
    RelevantRecords,
    AllRecords: evaluationsAll,
    Handle,
    Action,
  });
};

/**
 * This function sends a mutation request to a web worker to perform the specified action on the evaluations associated with a specific group and individual. It constructs a request object with the necessary parameters and sends it to the worker, which will handle the file system operations accordingly. The function returns a promise that resolves to the updated list of evaluation records after the mutation is complete.
 *
 * @param Group - The name of the group associated with the evaluations.
 * @param Individual - The name of the individual associated with the evaluations.
 * @param RelevantRecords - An optional array of evaluation records that are relevant to the mutation action (in this case, the evaluations to be imported).
 * @param AllRecords - An array of all evaluation records currently available, which may be used by the worker to perform the mutation action.
 * @param Handle - The file system directory handle used to access and manipulate the evaluation records.
 * @param Action - The action to be performed on the evaluations (in this case, 'Import').
 * @returns - A promise that resolves to the updated list of evaluation records after the mutation is complete.
 */
export const mutationEvaluationsAllWorker = async ({
  Group,
  Individual,
  AllRecords,
  RelevantRecords,
  Handle,
  Action,
}: {
  Group: string;
  Individual: string;
  RelevantRecords?: EvaluationRecord[];
  AllRecords: EvaluationRecord[];
  Handle: FileSystemDirectoryHandle;
  Action: 'Import';
}) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'MUTATE_EVALUATIONS_ALL',
    handle: Handle,
    groupName: Group,
    individualName: Individual,
    relevantRecords: RelevantRecords,
    allRecords: AllRecords,
    action: Action,
  } satisfies MutateEvaluationsAllRequest;

  return new Promise<EvaluationRecord[]>((resolve) => {
    worker.onmessage = (event: MessageEvent<MutationResponse>) => {
      const response = event.data;
      if (response.success) {
        const settings = response.data;
        resolve(settings);
      } else {
        throw new Error(`Worker error: ${response.error}\nStack: ${response.stack}`);
      }
    };
    worker.onerror = (error) => {
      console.error('Worker error:', error);
      throw new Error(`Worker error: ${error.message}`);
    };
    worker.postMessage(request);
  });
};
