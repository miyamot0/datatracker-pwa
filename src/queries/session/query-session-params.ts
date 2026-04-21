import { DEFAULT_SESSION_SETTINGS, SavedSettings } from '@/lib/dtos/session-settings';
import GenericFileWorker from '@/workers/queries/file-query-read-worker.ts?worker';
import { FetchSessionParamsRequest, QueryResponse } from '@/workers/queries/types/file-query-read-worker-types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Defines the query options for fetching session parameters based on the provided file system handle, group, individual, and evaluation identifiers. It constructs a query key using these parameters and specifies a query function that retrieves the session parameters by calling the fetchSessionParams function with the appropriate arguments.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the session parameters are being queried.
 * @param Individual - The individual identifier for which the session parameters are being queried.
 * @param Evaluation - The evaluation identifier for which the session parameters are being queried.
 * @returns An object containing the query key and query function for fetching session parameters.
 */
export const sessionQueryOptions = (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string,
) => ({
  queryKey: ['/', Group, Individual, Evaluation, 'settings'],
  queryFn: () => fetchSessionParamsWorker(Handle, Group, Individual, Evaluation),
});

/**
 * Queries the session parameters for a specific group, individual, and evaluation by accessing the file system and retrieving the 'settings.json' file within the appropriate evaluation directory. It returns a SavedSettings object that contains the details of the session parameters found, or default session settings if no settings are found or if there is an error during the file system operations.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the session parameters are being queried.
 * @param Individual - The individual identifier for which the session parameters are being queried.
 * @param Evaluation - The evaluation identifier for which the session parameters are being queried.
 * @returns A promise that resolves to a SavedSettings object containing the details of the session parameters found, or default session settings if no settings are found or if there is an error during the file system operations.
 * @throws An error if there is an issue with file system operations.
 */
export const fetchSessionParamsWorker = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string,
) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'FETCH_SESSION_PARAMS',
    handle: Handle,
    groupName: Group,
    individualName: Individual,
    evaluationName: Evaluation,
  } satisfies FetchSessionParamsRequest;

  return new Promise<SavedSettings>((resolve) => {
    worker.onmessage = (event: MessageEvent<QueryResponse>) => {
      const response = event.data;
      if (response.success) {
        const settings = response.data as SavedSettings;
        resolve(settings);
      } else {
        resolve(DEFAULT_SESSION_SETTINGS);
      }
    };
    worker.onerror = (error) => {
      console.error('Worker error:', error);
      resolve(DEFAULT_SESSION_SETTINGS);
    };
    worker.postMessage(request);
  });
};
