import { sessionOutcomesQueryOptions } from './query-session-outcomes';
import { ModifiedSessionResult } from '@/types/storage';
import { queryClient } from '@/App';
import { SavedSessionResult } from '@/lib/dtos/session-results';
import { MutateSessionOutcomesRequest, MutationResponse } from '@/workers/mutations/file-query-mutate-worker';
import GenericFileWorker from '@/workers/mutations/file-query-mutate-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mutates the session outcomes based on the specified action (Delete, EditCondition, Modify, Add) for a given group, individual, and evaluation. It interacts with the file system to delete, copy and rename, modify, or add session outcome files accordingly and returns the updated list of ModifiedSessionResult objects.
 *
 * @param Group - The group identifier for which the session outcomes are being mutated.
 * @param Individual - The individual identifier for which the session outcomes are being mutated.
 * @param Evaluation - The evaluation identifier for which the session outcomes are being mutated.
 * @param Outcomes - The list of session outcomes that are to be acted upon based on the specified action.
 * @param ConditionRename - (Optional) The new condition name to which the session outcomes should be moved when the action is 'EditCondition'.
 * @param UpdatedOutcome - (Optional) The updated ModifiedSessionResult object to be used when the action is 'Modify'.
 * @param PriorOutcome - (Optional) The prior ModifiedSessionResult object to be used when the action is 'Modify'.
 * @param NewOutcome - (Optional) The new SavedSessionResult object to be used when the action is 'Add'.
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Action - The type of mutation action to be performed on the session outcomes (Delete, EditCondition, Modify, Add).
 * @returns A promise that resolves to the updated list of ModifiedSessionResult objects after the mutation is complete.
 */
export const mutationSettingsOutcomes = async ({
  Group,
  Individual,
  Evaluation,
  Outcomes,
  ConditionRename,
  UpdatedOutcome,
  PriorOutcome,
  NewOutcome,
  Handle,
  Action,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Outcomes: ModifiedSessionResult[];
  ConditionRename?: string;
  UpdatedOutcome?: ModifiedSessionResult;
  PriorOutcome?: ModifiedSessionResult;
  NewOutcome?: SavedSessionResult;
  Handle: FileSystemDirectoryHandle;
  Action: 'Delete' | 'EditCondition' | 'Modify' | 'Add';
}): Promise<ModifiedSessionResult[]> => {
  const sessionOutcomes: ModifiedSessionResult[] = await queryClient.fetchQuery(
    sessionOutcomesQueryOptions(Handle, Group, Individual, Evaluation),
  );

  if (!sessionOutcomes) {
    throw new Error('Outcomes not found');
  }

  return await mutationKeysetsWorker({
    Group,
    Individual,
    Evaluation,
    Outcomes,
    ConditionRename,
    UpdatedOutcome,
    PriorOutcome,
    NewOutcome,
    Handle,
    CurrentOutcomes: sessionOutcomes,
    Action,
  });
};

/**
 * Sends a mutation request to the worker to perform the specified action (Delete, EditCondition, Modify, Add) on the session outcomes for a given group, individual, and evaluation. It constructs a request object with the necessary parameters and sends it to the worker, which will handle the file system operations accordingly. The function returns a promise that resolves to the updated list of ModifiedSessionResult objects after the mutation is complete.
 *
 * @param Group - The group identifier for which the session outcomes are being mutated.
 * @param Individual - The individual identifier for which the session outcomes are being mutated.
 * @param Evaluation - The evaluation identifier for which the session outcomes are being mutated.
 * @param Outcomes - The list of session outcomes that are to be acted upon based on the specified action.
 * @param ConditionRename - (Optional) The new condition name to which the session outcomes should be moved when the action is 'EditCondition'.
 * @param UpdatedOutcome - (Optional) The updated ModifiedSessionResult object to be used when the action is 'Modify'.
 * @param PriorOutcome - (Optional) The prior ModifiedSessionResult object to be used when the action is 'Modify'.
 * @param NewOutcome - (Optional) The new SavedSessionResult object to be used when the action is 'Add'.
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Action - The type of mutation action to be performed on the session outcomes (Delete, EditCondition, Modify, Add).
 * @returns A promise that resolves to the updated list of ModifiedSessionResult objects after the mutation is complete.
 */
export const mutationKeysetsWorker = async ({
  Group,
  Individual,
  Evaluation,
  Outcomes,
  ConditionRename,
  UpdatedOutcome,
  PriorOutcome,
  NewOutcome,
  Handle,
  CurrentOutcomes,
  Action,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Outcomes: ModifiedSessionResult[];
  ConditionRename?: string;
  UpdatedOutcome?: ModifiedSessionResult;
  PriorOutcome?: ModifiedSessionResult;
  NewOutcome?: SavedSessionResult;
  Handle: FileSystemDirectoryHandle;
  CurrentOutcomes: ModifiedSessionResult[];
  Action: 'Delete' | 'EditCondition' | 'Modify' | 'Add';
}) => {
  const worker = new GenericFileWorker();
  const request = {
    id: uuidv4(),
    type: 'MUTATE_SESSION_OUTCOMES',
    handle: Handle,
    groupName: Group,
    individualName: Individual,
    evaluationName: Evaluation,
    outcomes: Outcomes,
    conditionRename: ConditionRename,
    updatedOutcome: UpdatedOutcome,
    priorOutcome: PriorOutcome,
    newOutcome: NewOutcome,
    sessionOutcomes: CurrentOutcomes,
    action: Action,
  } satisfies MutateSessionOutcomesRequest;

  return new Promise<ModifiedSessionResult[]>((resolve) => {
    worker.onmessage = (event: MessageEvent<MutationResponse>) => {
      const response = event.data;
      if (response.success) {
        const outcomes = response.data;
        resolve(outcomes);
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
