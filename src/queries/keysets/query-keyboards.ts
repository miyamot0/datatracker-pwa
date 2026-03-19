import { KeySet } from '@/types/keyset';
import GenericFileWorker from '@/workers/queries/file-query-read-worker.ts?worker';
import { FetchKeysetsRequest, QueryResponse } from '@/workers/queries/types/file-query-read-worker-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Queries the keyboards for a specific group and individual by accessing the file system and retrieving the relevant information about the keyboards stored within the individual's folder. It returns an array of KeySet objects that contain the details of each keyboard found, or an empty array if no keyboards are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the keyboards are being queried.
 * @param Individual - The individual identifier for which the keyboards are being queried.
 * @returns A promise that resolves to an array of KeySet objects containing the details of each keyboard found, or an empty array if no keyboards are found or if there is an error during the file system operations.
 */
export const keyboardQueryOptions = (Handle: FileSystemDirectoryHandle, Group: string, Individual: string) => ({
  queryKey: ['/', Group, Individual, 'keyboards'],
  queryFn: () => fetchKeyboardsWorker(Handle, Group, Individual),
});

/**
 * Fetches the keyboards for a specific group and individual by accessing the file system and retrieving the relevant information about the keyboards stored within the individual's folder. It returns an array of KeySet objects that contain the details of each keyboard found, or an empty array if no keyboards are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the keyboards are being fetched.
 * @param Individual - The individual identifier for which the keyboards are being fetched.
 * @returns A promise that resolves to an array of KeySet objects containing the details of each keyboard found, or an empty array if no keyboards are found or if there is an error during the file system operations.
 */
export const fetchKeyboardsWorker = async (Handle: FileSystemDirectoryHandle, Group: string, Individual: string) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'FETCH_KEYSETS',
    handle: Handle,
    groupName: Group,
    individualName: Individual,
  } satisfies FetchKeysetsRequest;

  return new Promise<KeySet[]>((resolve) => {
    worker.onmessage = (event: MessageEvent<QueryResponse>) => {
      const response = event.data;
      if (response.success) {
        const keysets = response.data as KeySet[];
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
