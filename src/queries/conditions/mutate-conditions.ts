import { queryClient } from '@/App';
import { conditionQueryOptions } from './query-conditions';
import GenericFileWorker from '@/workers/mutations/file-query-mutate-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';
import { MutateConditionsRequest, MutationResponse } from '@/workers/mutations/file-query-mutate-worker';

/**
 * This function is responsible for mutating the conditions associated with a specific group, individual, and evaluation. It takes in the necessary parameters to identify the target evaluation and the condition to be added. The function first retrieves the current list of conditions using React Query's `fetchQuery` method. It then performs the specified action (in this case, adding a new condition) by interacting with the file system through the provided directory handle. Finally, it returns the updated list of conditions after the mutation is complete.
 *
 * @param Group - The name of the group associated with the evaluation.
 * @param Individual - The name of the individual associated with the evaluation.
 * @param Evaluation - The name of the evaluation to which the condition will be added.
 * @param Condition - The name of the condition to be added to the evaluation.
 * @param Handle - The file system directory handle used to access and manipulate the evaluation records.
 * @param Action - The action to be performed on the conditions (in this case, 'Add').
 * @returns - A promise that resolves to the updated list of conditions after the mutation is complete.
 */
export const mutationConditions = async ({
  Group,
  Individual,
  Evaluation,
  Condition,
  Handle,
  Action,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Condition: string;
  Handle: FileSystemDirectoryHandle;
  Action: 'Add' | 'Clear';
}): Promise<string[]> => {
  const conditions: string[] = await queryClient.fetchQuery(
    conditionQueryOptions(Handle, Group, Individual, Evaluation),
  );

  if (!conditions) {
    throw new Error('Conditions not found');
  }

  return await mutationConditionsWorker({ Handle, Group, Individual, Evaluation, Action, Condition });
};

/**
 * This function is responsible for sending a mutation request to the worker to perform the specified action (e.g., adding or clearing conditions) on the conditions associated with a specific group, individual, and evaluation. It constructs a request object with the necessary parameters and sends it to the worker. The function returns a promise that resolves to the updated list of conditions after the mutation is complete.
 *
 * @param Handle - The file system directory handle used to access and manipulate the evaluation records.
 * @param Group - The name of the group associated with the evaluation.
 * @param Individual - The name of the individual associated with the evaluation.
 * @param Evaluation - The name of the evaluation to which the condition will be added or cleared.
 * @param Action - The action to be performed on the conditions (e.g., 'Add' or 'Clear').
 * @param Condition - The name of the condition to be added to the evaluation (optional).
 * @returns - A promise that resolves to the updated list of conditions after the mutation is complete.
 */
export const mutationConditionsWorker = async ({
  Handle,
  Group,
  Individual,
  Evaluation,
  Action,
  Condition,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  Evaluation: string;
  Action: 'Add' | 'Clear';
  Condition?: string;
}) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'MUTATE_CONDITIONS',
    handle: Handle,
    groupName: Group,
    individualName: Individual,
    evaluationName: Evaluation,
    conditionName: Condition, // This should be passed as a parameter based on the desired mutation
    action: Action, // This should also be passed as a parameter based on the desired mutation
  } satisfies MutateConditionsRequest;

  return new Promise<string[]>((resolve) => {
    worker.onmessage = (event: MessageEvent<MutationResponse>) => {
      const response = event.data;
      if (response.success) {
        const directories = response.data;
        resolve(directories);
      } else {
        resolve([]);
      }
    };
    worker.onerror = (error) => {
      console.error('Worker error:', error);
      resolve([]);
    };
    worker.postMessage(request);
  });
};
