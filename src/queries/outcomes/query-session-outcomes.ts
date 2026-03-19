import { ModifiedSessionResult } from '@/types/storage';
import { FetchSessionOutcomesRequest, QueryResponse } from '@/workers/queries/file-query-worker';
import GenericFileWorker from '@/workers/queries/file-query-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Queries the session outcomes for a specific group, individual, and evaluation by accessing the file system and retrieving the relevant session outcome files. It returns an array of ModifiedSessionResult objects that contain the details of each session outcome found within the file system structure, or an empty array if no session outcomes are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the session outcomes are being queried.
 * @param Individual - The individual identifier for which the session outcomes are being queried.
 * @param Evaluation - The evaluation identifier for which the session outcomes are being queried.
 * @returns A promise that resolves to an array of ModifiedSessionResult objects containing the details of each session outcome found, or an empty array if no session outcomes are found or if there is an error during the file system operations.
 */
export const sessionOutcomesQueryOptions = (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string,
) => ({
  queryKey: ['/', Group, Individual, Evaluation, 'outcomes'],
  queryFn: () => fetchSessionOutcomesWorker(Handle, Group, Individual, Evaluation),
});

/**
 * Fetches the session outcomes for a specific group, individual, and evaluation by accessing the file system and retrieving the relevant session outcome files. It returns an array of ModifiedSessionResult objects that contain the details of each session outcome found within the file system structure, or an empty array if no session outcomes are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the session outcomes are being fetched.
 * @param Individual - The individual identifier for which the session outcomes are being fetched.
 * @param Evaluation - The evaluation identifier for which the session outcomes are being fetched.
 * @returns A promise that resolves to an array of ModifiedSessionResult objects containing the details of each session outcome found, or an empty array if no session outcomes are found or if there is an error during the file system operations.
 */
export const fetchSessionOutcomesWorker = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string,
) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'FETCH_OUTCOMES',
    handle: Handle,
    groupName: Group,
    individualName: Individual,
    evaluationName: Evaluation,
  } satisfies FetchSessionOutcomesRequest;

  return new Promise<ModifiedSessionResult[]>((resolve) => {
    worker.onmessage = (event: MessageEvent<QueryResponse>) => {
      const response = event.data;
      if (response.success) {
        const sessionOutcomes = response.data;
        resolve(sessionOutcomes);
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
