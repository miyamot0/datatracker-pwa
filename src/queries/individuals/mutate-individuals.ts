import { clientQueryOptions } from './query-individuals';
import { queryClient } from '@/App';
import GenericFileWorker from '@/workers/mutations/file-query-mutate-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';
import { MutateIndividualsRequest, MutationResponse } from '@/workers/mutations/file-query-mutate-worker';

/**
 * This function is responsible for mutating the individuals associated with a specific group. It takes in the necessary parameters to identify the target group and the individuals to be added or deleted. The function first retrieves the current list of individuals using React Query's `fetchQuery` method. It then performs the specified action (adding or deleting individuals) by interacting with the file system through the provided directory handle. Finally, it returns the updated list of individual names after the mutation is complete.
 * @param Group - The name of the group associated with the individuals.
 * @param Individuals - An array of individual names that are relevant to the mutation action (in this case, the individuals to be added or deleted).
 * @param Handle - The file system directory handle used to access and manipulate the individual records.
 * @param Action - The action to be performed on the individuals (in this case, 'Add' or 'Delete').
 * @returns - A promise that resolves to the updated list of individual names after the mutation is complete.
 */
export const mutationIndividuals = async ({
  Group,
  Individuals,
  Handle,
  Action,
}: {
  Group: string;
  Individuals: string[];
  Handle: FileSystemDirectoryHandle;
  Action: 'Add' | 'Delete';
}): Promise<string[]> => {
  const individuals: string[] = await queryClient.fetchQuery(clientQueryOptions(Handle, Group));

  if (!individuals) {
    throw new Error('Individuals not found');
  }

  return await mutationIndividualsWorker({ Handle, Group, Individuals, Action });
};

export const mutationIndividualsWorker = async ({
  Handle,
  Group,
  Individuals,
  Action,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individuals: string[];
  Action: 'Add' | 'Delete';
}) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'MUTATE_INDIVIDUALS',
    handle: Handle,
    groupName: Group,
    individualNames: Individuals,
    action: Action,
  } satisfies MutateIndividualsRequest;

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
