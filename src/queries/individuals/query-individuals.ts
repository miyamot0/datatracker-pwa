import GenericFileWorker from '@/workers/queries/file-query-read-worker.ts?worker';
import { FetchClientsRequest, QueryResponse } from '@/workers/queries/types/file-query-read-worker-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Queries the individuals for a specific group by accessing the file system and retrieving the names of individual directories within the group's folder. It returns an array of individual names that are found, or an empty array if no individuals are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the individuals are being queried.
 * @returns A promise that resolves to an array of individual names found within the group's folder, or an empty array if no individuals are found or if there is an error during the file system operations.
 */
export const clientQueryOptions = (Handle: FileSystemDirectoryHandle, Group: string) => ({
  queryKey: ['/', Group],
  queryFn: () => fetchIndividualsWorker(Handle, Group),
});

/**
 * Fetches the individuals for a specific group by accessing the file system and retrieving the names of individual directories within the group's folder. It returns an array of individual names that are found, or an empty array if no individuals are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the individuals are being fetched.
 * @returns A promise that resolves to an array of individual names found within the group's folder, or an empty array if no individuals are found or if there is an error during the file system operations.
 */
export const fetchIndividualsWorker = async (Handle: FileSystemDirectoryHandle, Group: string) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'FETCH_CLIENTS',
    handle: Handle,
    groupName: Group,
  } satisfies FetchClientsRequest;

  return new Promise<string[]>((resolve) => {
    worker.onmessage = (event: MessageEvent<QueryResponse>) => {
      const response = event.data;
      if (response.success) {
        const directories = response.data as string[];
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
