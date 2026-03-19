import { KeySetExtended } from '@/types/keyset';
import { FetchKeysetsAllRequest, QueryResponse } from '@/workers/queries/file-query-worker';
import GenericFileWorker from '@/workers/queries/file-query-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Queries all keyboards by accessing the file system and retrieving the relevant information about groups, individuals, and their associated keyboards. It returns an array of KeySetExtended objects that contain the details of each keyboard found within the file system structure, or an empty array if no keyboards are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the keyboards are being queried.
 * @param Individual - The individual identifier for which the keyboards are being queried.
 * @returns A promise that resolves to an array of KeySetExtended objects containing the details of each keyboard found, or an empty array if no keyboards are found or if there is an error during the file system operations.
 */
export const keyboardsAllQueryOptions = (Handle: FileSystemDirectoryHandle, Group: string, Individual: string) => ({
  queryKey: ['/', Group, 'metaKeyboards'],
  queryFn: () => fetchKeyboardsAllWorker(Handle, Group, Individual),
});

/**
 * Fetches all keyboards by accessing the file system and retrieving the relevant information about groups, individuals, and their associated keyboards. It returns an array of KeySetExtended objects that contain the details of each keyboard found within the file system structure, or an empty array if no keyboards are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the keyboards are being fetched.
 * @param Individual - The individual identifier for which the keyboards are being fetched.
 * @returns A promise that resolves to an array of KeySetExtended objects containing the details of each keyboard found, or an empty array if no keyboards are found or if there is an error during the file system operations.
 */
export const fetchKeyboardsAllWorker = async (Handle: FileSystemDirectoryHandle, Group: string, Individual: string) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'FETCH_KEYSETS_ALL',
    handle: Handle,
    groupName: Group,
    individualName: Individual,
  } satisfies FetchKeysetsAllRequest;

  return new Promise<KeySetExtended[]>((resolve) => {
    worker.onmessage = (event: MessageEvent<QueryResponse>) => {
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
