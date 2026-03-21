import { KeySet, KeySetExtended } from '@/types/keyset';
import { keyboardsAllQueryOptions } from './query-keyboards-all';
import { queryClient } from '@/App';
import GenericFileWorker from '@/workers/mutations/file-query-mutate-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';
import { MutateKeysetsAllRequest, MutationResponse } from '@/workers/mutations/file-query-mutate-worker';

/**
 * Mutates the list of keyboards by importing new keysets and filtering out existing ones for a specific individual and group.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the keyboards are being mutated.
 * @param Individual - The individual identifier for which the keyboards are being mutated.
 * @param KeySets - An array of KeySet objects that are to be imported and considered for mutation.
 * @returns A filtered array of KeySet objects that do not already exist for the specified individual and group, after importing new keysets.
 */
export const mutateKeyboardsAll = async ({
  Handle,
  Group,
  Individual,
  KeySets,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  KeySets: KeySet[];
}) => {
  const keysets = await queryClient.fetchQuery(keyboardsAllQueryOptions(Handle, Group, Individual));

  return await mutateKeyboardsAllWorker({
    Handle,
    Group,
    Individual,
    KeySets,
    AllKeySets: keysets,
  });
};

/**
 * Worker function that performs the mutation of keyboards by importing new keysets and filtering out existing ones for a specific individual and group.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the keyboards are being mutated.
 * @param Individual - The individual identifier for which the keyboards are being mutated.
 * @param KeySets - An array of KeySet objects that are to be imported and considered for mutation.
 * @param AllKeySets - An array of all existing KeySetExtended objects that are used to filter out existing keysets for the specified individual and group.
 * @returns A promise that resolves to an array of KeySet objects that do not already exist for the specified individual and group, after importing new keysets.
 */
export const mutateKeyboardsAllWorker = async ({
  Handle,
  Group,
  Individual,
  KeySets,
  AllKeySets,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  KeySets: KeySet[];
  AllKeySets: KeySetExtended[];
}) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'MUTATE_KEYSETS_ALL',
    handle: Handle,
    groupName: Group,
    individualName: Individual,
    keySets: KeySets,
    allKeySets: AllKeySets,
  } satisfies MutateKeysetsAllRequest;

  return new Promise<KeySet[]>((resolve) => {
    worker.onmessage = (event: MessageEvent<MutationResponse>) => {
      const response = event.data;
      if (response.success) {
        const keySets = response.data;
        resolve(keySets);
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
