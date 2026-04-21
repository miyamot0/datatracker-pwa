import { evaluationQueryOptions } from './query-evaluations';
import { queryClient } from '@/App';
import GenericFileWorker from '@/workers/mutations/file-query-mutate-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';
import { MutateEvaluationsRequest, MutationResponse } from '@/workers/mutations/file-query-mutate-worker';

/**
 * This function is responsible for mutating the evaluations associated with a specific group and individual. It takes in the necessary parameters to identify the target evaluations and the action to be performed (in this case, adding, deleting, duplicating, or renaming evaluations). The function first retrieves the current list of evaluations using React Query's `fetchQuery` method. It then performs the specified action by interacting with the file system through the provided directory handle. Finally, it returns the updated list of evaluation names after the mutation is complete.
 *
 * @param Group - The name of the group associated with the evaluations.
 * @param Individual - The name of the individual associated with the evaluations.
 * @param Evaluations - An array of evaluation names that are relevant to the mutation action (in this case, the evaluations to be added, deleted, duplicated, or renamed).
 * @param Rename - An optional string representing the new name for the duplicated or renamed evaluation (required for duplication and renaming actions).
 * @param Handle - The file system directory handle used to access and manipulate the evaluation records.
 * @param Action - The action to be performed on the evaluations (in this case, 'Add', 'Delete', 'Duplicate', or 'Rename').
 * @returns - A promise that resolves to the updated list of evaluation names after the mutation is complete.
 */
export const mutationEvaluations = async ({
  Group,
  Individual,
  Evaluations,
  Rename,
  Handle,
  Action,
}: {
  Group: string;
  Individual: string;
  Evaluations: string[];
  Rename?: string;
  Handle: FileSystemDirectoryHandle;
  Action: 'Add' | 'Delete' | 'Duplicate' | 'Rename';
}): Promise<string[]> => {
  const evaluations: string[] = await queryClient.fetchQuery(evaluationQueryOptions(Handle, Group, Individual));

  if (!evaluations) {
    throw new Error('Evaluations not found');
  }

  return await mutationEvaluationsWorker({ Handle, Group, Individual, Evaluations, Rename, Action });
};

/**
 * This function is responsible for sending a mutation request to the worker to perform the specified action (e.g., adding, deleting, duplicating, or renaming evaluations) on the evaluations associated with a specific group and individual. It constructs a request object with the necessary parameters and sends it to the worker. The function returns a promise that resolves to the updated list of evaluation names after the mutation is complete.
 *
 * @param Handle - The file system directory handle used to access and manipulate the evaluation records.
 * @param Group - The name of the group associated with the evaluations.
 * @param Individual - The name of the individual associated with the evaluations.
 * @param Evaluations - An array of evaluation names that are relevant to the mutation action (in this case, the evaluations to be added, deleted, duplicated, or renamed).
 * @param Rename - An optional string representing the new name for the duplicated or renamed evaluation (required for duplication and renaming actions).
 * @param Action - The action to be performed on the evaluations (in this case, 'Add', 'Delete', 'Duplicate', or 'Rename').
 * @returns - A promise that resolves to the updated list of evaluation names after the mutation is complete.
 */
export const mutationEvaluationsWorker = async ({
  Handle,
  Group,
  Individual,
  Evaluations,
  Rename,
  Action,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  Evaluations: string[];
  Rename?: string;
  Action: 'Add' | 'Delete' | 'Duplicate' | 'Rename';
}) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'MUTATE_EVALUATIONS',
    handle: Handle,
    groupName: Group,
    individualName: Individual,
    evaluationNames: Evaluations,
    renameTo: Rename,
    action: Action,
  } satisfies MutateEvaluationsRequest;

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
