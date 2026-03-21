import { sessionQueryOptions } from './query-session-params';
import { SavedSettings } from '@/lib/dtos';
import { queryClient } from '@/App';
import { MutateSessionParamsRequest, MutationResponse } from '@/workers/mutations/file-query-mutate-worker';
import GenericFileWorker from '@/workers/mutations/file-query-mutate-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mutates the session parameters by updating the settings for a specific group, individual, and evaluation. It interacts with the file system to write the new settings to a 'settings.json' file within the appropriate evaluation directory and returns the updated settings after the mutation is complete.
 *
 * @param Group - The group identifier for which the session parameters are being mutated.
 * @param Individual - The individual identifier for which the session parameters are being mutated.
 * @param Evaluation - The evaluation identifier for which the session parameters are being mutated.
 * @param Settings - The new settings object that is to be written to the file system and returned after mutation.
 * @param Handle - The file system directory handle for accessing the storage.
 * @returns A promise that resolves to the updated SavedSettings object after the mutation is complete.
 * @throws An error if the existing settings cannot be found or if there is an issue with file system operations.
 */
export const mutationSettingsParams = async ({
  Group,
  Individual,
  Evaluation,
  Settings,
  Handle,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Settings: SavedSettings;
  Handle: FileSystemDirectoryHandle;
}): Promise<SavedSettings> => {
  const savedSettings: SavedSettings = await queryClient.fetchQuery(
    sessionQueryOptions(Handle, Group, Individual, Evaluation),
  );

  if (!savedSettings) {
    throw new Error('Settings not found');
  }

  return await mutationSessionParamsWorker({
    Group,
    Individual,
    Evaluation,
    Settings,
    Handle,
  });
};

/**
 * Sends a mutation request to the worker to update the session parameters for a specific group, individual, and evaluation. It constructs a request object with the necessary parameters and sends it to the worker, which will handle the file system operations accordingly. The function returns a promise that resolves to the updated SavedSettings object after the mutation is complete.
 *
 * @param Group - The group identifier for which the session parameters are being mutated.
 * @param Individual - The individual identifier for which the session parameters are being mutated.
 * @param Evaluation - The evaluation identifier for which the session parameters are being mutated.
 * @param Settings - The new settings object that is to be written to the file system and returned after mutation.
 * @param Handle - The file system directory handle for accessing the storage.
 * @returns A promise that resolves to the updated SavedSettings object after the mutation is complete.
 */
export const mutationSessionParamsWorker = async ({
  Group,
  Individual,
  Evaluation,
  Settings,
  Handle,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Settings: SavedSettings;
  Handle: FileSystemDirectoryHandle;
}) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'MUTATE_SESSION_PARAMS',
    handle: Handle,
    groupName: Group,
    individualName: Individual,
    evaluationName: Evaluation,
    settings: Settings,
  } satisfies MutateSessionParamsRequest;

  return new Promise<SavedSettings>((resolve) => {
    worker.onmessage = (event: MessageEvent<MutationResponse>) => {
      const response = event.data;
      if (response.success) {
        const settings = response.data;
        resolve(settings);
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
