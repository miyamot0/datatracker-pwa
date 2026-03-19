import { FetchGroupsRequest, QueryResponse } from '@/workers/queries/file-query-read-worker';
import GenericFileWorker from '@/workers/queries/file-query-read-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Queries the groups by accessing the file system and retrieving the names of group directories. It returns an array of group names that are found, or an empty array if no groups are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @returns A promise that resolves to an array of group names found within the file system, or an empty array if no groups are found or if there is an error during the file system operations.
 */
export const groupQueryOptions = (Handle: FileSystemDirectoryHandle) => ({
  queryKey: ['/'],
  queryFn: () => fetchGroupsWorker(Handle),
});

/**
 * Fetches the groups by accessing the file system and retrieving the names of group directories. It returns an array of group names that are found, or an empty array if no groups are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @returns A promise that resolves to an array of group names found within the file system, or an empty array if no groups are found or if there is an error during the file system operations.
 */
export const fetchGroupsWorker = async (Handle: FileSystemDirectoryHandle) => {
  const worker = new GenericFileWorker();
  const request = { id: uuidv4(), type: 'FETCH_GROUPS', handle: Handle } satisfies FetchGroupsRequest;

  return new Promise<string[]>((resolve) => {
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
