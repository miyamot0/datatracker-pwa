import { EvaluationRecord } from '../keysets/types/evaluation-record';

import { FetchEvaluationsAllRequest, QueryResponse } from '@/workers/queries/file-query-worker';
import GenericFileWorker from '@/workers/queries/file-query-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Queries all evaluations by accessing the file system and retrieving the relevant information about groups, individuals, evaluations, and their associated conditions. It returns an array of EvaluationRecord objects that contain the details of each evaluation found within the file system structure, or an empty array if no evaluations are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @returns A promise that resolves to an array of EvaluationRecord objects containing the details of each evaluation found, or an empty array if no evaluations are found or if there is an error during the file system operations.
 */
export const evaluationsAllQueryOptions = (Handle: FileSystemDirectoryHandle) => ({
  queryKey: ['/', 'metaEvaluations'],
  queryFn: () => fetchEvaluationsAllWorker(Handle),
});

/**
 * Fetches all evaluations by accessing the file system and retrieving the relevant information about groups, individuals, evaluations, and their associated conditions. It returns an array of EvaluationRecord objects that contain the details of each evaluation found within the file system structure, or an empty array if no evaluations are found or if there is an error during the file system operations.
 * @param Handle - The file system directory handle for accessing the storage.
 * @returns A promise that resolves to an array of EvaluationRecord objects containing the details of each evaluation found, or an empty array if no evaluations are found or if there is an error during the file system operations.
 */
export const fetchEvaluationsAllWorker = async (Handle: FileSystemDirectoryHandle) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'FETCH_EVALUATIONS_ALL',
    handle: Handle,
  } satisfies FetchEvaluationsAllRequest;

  return new Promise<EvaluationRecord[]>((resolve) => {
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
