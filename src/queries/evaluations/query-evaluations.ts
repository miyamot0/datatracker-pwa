import GenericFileWorker from '@/workers/queries/file-query-read-worker.ts?worker';
import { FetchEvaluationsRequest, QueryResponse } from '@/workers/queries/types/file-query-read-worker-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Queries the evaluations for a specific group and individual by accessing the file system and retrieving the names of evaluation directories within the individual's folder. It returns an array of evaluation names that are found, or an empty array if no evaluations are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the evaluations are being queried.
 * @param Individual - The individual identifier for which the evaluations are being queried.
 * @returns A promise that resolves to an array of evaluation names found within the individual's folder, or an empty array if no evaluations are found or if there is an error during the file system operations.
 */
export const evaluationQueryOptions = (Handle: FileSystemDirectoryHandle, Group: string, Individual: string) => ({
  queryKey: ['/', Group, Individual],
  queryFn: () => fetchEvaluationsWorker(Handle, Group, Individual),
});

/**
 * Fetches the evaluations for a specific group and individual by accessing the file system and retrieving the names of evaluation directories within the individual's folder. It returns an array of evaluation names that are found, or an empty array if no evaluations are found or if there is an error during the file system operations.
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the evaluations are being fetched.
 * @param Individual - The individual identifier for which the evaluations are being fetched.
 * @returns A promise that resolves to an array of evaluation names found within the individual's folder, or an empty array if no evaluations are found or if there is an error during the file system operations.
 */
export const fetchEvaluationsWorker = async (Handle: FileSystemDirectoryHandle, Group: string, Individual: string) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'FETCH_EVALUATIONS',
    handle: Handle,
    groupName: Group,
    clientName: Individual,
  } satisfies FetchEvaluationsRequest;

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
