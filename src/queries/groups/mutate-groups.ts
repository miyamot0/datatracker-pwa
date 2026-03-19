import { queryClient } from '@/App';
import { groupQueryOptions } from './query-groups';
import GenericFileWorker from '@/workers/mutations/file-query-mutate-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';
import { MutateGroupsRequest, MutationResponse } from '@/workers/mutations/file-query-mutate-worker';

/**
 * This function is responsible for mutating the groups within the application. It takes in the necessary parameters to identify the target group and the action to be performed (adding, deleting, or loading demo data). The function first retrieves the current list of groups using React Query's `fetchQuery` method. It then performs the specified action by interacting with the file system through the provided directory handle. Finally, it returns the updated list of groups after the mutation is complete.
 *
 * @param Group - An array containing the name of the group to be mutated (in this case, the group to be added or deleted).
 * @param Handle - The file system directory handle used to access and manipulate the group records.
 * @param Action - The action to be performed on the groups (in this case, 'Add', 'Delete', or 'Demo').
 * @returns - A promise that resolves to the updated list of groups after the mutation is complete.
 */
export const mutationGroups = async ({
  Group,
  Handle,
  Action,
}: {
  Group: string[];
  Handle: FileSystemDirectoryHandle;
  Action: 'Add' | 'Delete' | 'Demo';
}): Promise<string[]> => {
  const groups: string[] = await queryClient.fetchQuery(groupQueryOptions(Handle));

  if (!groups) {
    throw new Error('Groups not found');
  }

  return await mutationGroupsWorker({ Handle, Group, Action });
};

/**
 * This function is responsible for sending a mutation request to the worker to perform the specified action (e.g., adding, deleting, or loading demo data) on the groups within the application. It constructs a request object with the necessary parameters and sends it to the worker. The function returns a promise that resolves to the updated list of groups after the mutation is complete.
 *
 * @param Handle - The file system directory handle used to access and manipulate the group records.
 * @param Group - An array containing the name of the group to be mutated (in this case, the group to be added or deleted).
 * @param Action - The action to be performed on the groups (in this case, 'Add', 'Delete', or 'Demo').
 * @returns - A promise that resolves to the updated list of groups after the mutation is complete.
 */
export const mutationGroupsWorker = async ({
  Handle,
  Group,
  Action,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string[];
  Action: 'Add' | 'Delete' | 'Demo';
}) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'MUTATE_GROUPS',
    handle: Handle,
    groupNames: Group,
    action: Action,
  } satisfies MutateGroupsRequest;

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
