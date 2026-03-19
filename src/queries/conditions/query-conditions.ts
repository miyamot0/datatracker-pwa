import { FetchConditionsRequest, QueryResponse } from '@/workers/queries/file-query-worker';
import GenericFileWorker from '@/workers/queries/file-query-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Queries the conditions for a specific group, individual, and evaluation by accessing the file system and retrieving the names of condition directories within the evaluation folder. It returns an array of condition names that are found, or an empty array if no conditions are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the conditions are being queried.
 * @param Individual - The individual identifier for which the conditions are being queried.
 * @param Evaluation - The evaluation identifier for which the conditions are being queried.
 * @returns A promise that resolves to an array of condition names found within the evaluation folder, or an empty array if no conditions are found or if there is an error during the file system operations.
 */
export const conditionQueryOptions = (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string,
) => ({
  queryKey: ['/', Group, Individual, Evaluation, 'conditions'],
  queryFn: () => fetchConditionsWorker(Handle, Group, Individual, Evaluation),
});

/**
 * Fetches the conditions for a specific group, individual, and evaluation by accessing the file system and retrieving the names of condition directories within the evaluation folder. It returns an array of condition names that are found, or an empty array if no conditions are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the conditions are being fetched.
 * @param Individual - The individual identifier for which the conditions are being fetched.
 * @param Evaluation - The evaluation identifier for which the conditions are being fetched.
 * @returns A promise that resolves to an array of condition names found within the evaluation folder, or an empty array if no conditions are found or if there is an error during the file system operations.
 */
export const fetchConditionsWorker = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string,
) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'FETCH_CONDITIONS',
    handle: Handle,
    groupName: Group,
    individualName: Individual,
    evaluationName: Evaluation,
  } satisfies FetchConditionsRequest;

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
