import { keyboardQueryOptions } from './query-keyboards';
import { KeySet } from '@/types/keyset';
import { queryClient } from '@/App';
import GenericFileWorker from '@/workers/mutations/file-query-mutate-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';
import { MutateKeysetsRequest, MutationResponse } from '@/workers/mutations/file-query-mutate-worker';

/**
 * Mutates the list of keyboards based on the specified action (Add, Delete, Duplicate, Rename, Update) for a given group and individual. It interacts with the file system to create, delete, duplicate, or update keyboard files accordingly and returns the updated list of KeySet objects.
 *
 * @param Group - The group identifier for which the keyboards are being mutated.
 * @param Individual - The individual identifier for which the keyboards are being mutated.
 * @param Keysets - An array of keyboard names that are to be acted upon based on the specified action.
 * @param Rename - (Optional) The new name for the keyboard when the action is 'Duplicate' or 'Rename'.
 * @param NewKeySet - (Optional) The new KeySet object to be used when the action is 'Update'.
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Action - The type of mutation action to be performed on the keyboards (Add, Delete, Duplicate, Rename, Update).
 * @returns A promise that resolves to the updated list of KeySet objects after the mutation is complete.
 */
export const mutationKeyboards = async ({
  Group,
  Individual,
  Keysets,
  Rename,
  NewKeySet,
  Handle,
  Action,
}: {
  Group: string;
  Individual: string;
  Keysets: string[];
  Rename?: string;
  NewKeySet?: KeySet;
  Handle: FileSystemDirectoryHandle;
  Action: 'Add' | 'Delete' | 'Duplicate' | 'Rename' | 'Update';
}): Promise<KeySet[]> => {
  const keysets: KeySet[] = await queryClient.fetchQuery(keyboardQueryOptions(Handle, Group, Individual));

  // TODO: Need to handle a rename
  if (!keysets) {
    throw new Error('Keysets not found');
  }

  return await mutationKeysetsWorker({ Handle, Group, Individual, Keysets, Action, Rename, NewKeySet });
};

/**
 * Sends a mutation request to the worker to perform the specified action (Add, Delete, Duplicate, Rename, Update) on the keyboards for a given group and individual. It constructs a request object with the necessary parameters and sends it to the worker, which will handle the file system operations accordingly. The function returns a promise that resolves to the updated list of KeySet objects after the mutation is complete.
 *
 * @param Group - The group identifier for which the keyboards are being mutated.
 * @param Individual - The individual identifier for which the keyboards are being mutated.
 * @param Keysets - An array of keyboard names that are to be acted upon based on the specified action.
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Action - The type of mutation action to be performed on the keyboards (Add, Delete, Duplicate, Rename, Update).
 * @returns A promise that resolves to the updated list of KeySet objects after the mutation is complete.
 */
export const mutationKeysetsWorker = async ({
  Handle,
  Group,
  Individual,
  Keysets,
  Rename,
  NewKeySet,
  Action,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  Keysets: string[];
  Action: 'Add' | 'Delete' | 'Duplicate' | 'Rename' | 'Update';
  Rename?: string;
  NewKeySet?: KeySet;
}) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'MUTATE_KEYSETS',
    handle: Handle,
    groupName: Group,
    individualName: Individual,
    renameTo: Rename,
    newKeySet: NewKeySet,

    keysetNames: Keysets,
    action: Action,
  } satisfies MutateKeysetsRequest;

  return new Promise<KeySet[]>((resolve) => {
    worker.onmessage = (event: MessageEvent<MutationResponse>) => {
      const response = event.data;
      if (response.success) {
        const keysets = response.data;
        resolve(keysets);
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
