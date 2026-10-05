import { clientQueryOptions } from './query-individuals';
import { queryClient } from '@/App';
import DeIdentifyIndividualWorker from '@/workers/mutations/deidentify-individual-worker.ts?worker';
import { v4 as uuidv4 } from 'uuid';
import {
  DeIdentifyIndividualRequest,
  DeIdentifyIndividualResponse,
} from '@/workers/mutations/types/deidentify-individual-worker-types';

/**
 * De-identifies a source individual into a brand new individual: copies every evaluation/condition/
 * session-result file and every per-individual KeySet file, pseudonymizing names and shifting dates
 * by one shared offset anchored to January 1st of `ReplacementYear`. The source individual is untouched.
 *
 * @param Group - The name of the group associated with the individuals.
 * @param SourceIndividual - The name of the individual to de-identify.
 * @param NewIndividual - The name of the new, de-identified individual to create.
 * @param ReplacementYear - The arbitrary replacement year; the individual's earliest timestamp shifts onto January 1st of this year.
 * @param RedactComments - Whether session `Comments` should be stripped from the de-identified copy.
 * @param Handle - The file system directory handle used to access and manipulate the individual records.
 * @returns - A promise that resolves to the updated list of individual names after the mutation is complete.
 */
export const mutationDeIdentifyIndividual = async ({
  Group,
  SourceIndividual,
  NewIndividual,
  ReplacementYear,
  RedactComments,
  Handle,
}: {
  Group: string;
  SourceIndividual: string;
  NewIndividual: string;
  ReplacementYear: number;
  RedactComments: boolean;
  Handle: FileSystemDirectoryHandle;
}): Promise<string[]> => {
  const individuals: string[] = await queryClient.fetchQuery(clientQueryOptions(Handle, Group));

  if (!individuals) {
    throw new Error('Individuals not found');
  }

  return await mutationDeIdentifyIndividualWorker({
    Handle,
    Group,
    SourceIndividual,
    NewIndividual,
    ReplacementYear,
    RedactComments,
  });
};

export const mutationDeIdentifyIndividualWorker = async ({
  Handle,
  Group,
  SourceIndividual,
  NewIndividual,
  ReplacementYear,
  RedactComments,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  SourceIndividual: string;
  NewIndividual: string;
  ReplacementYear: number;
  RedactComments: boolean;
}) => {
  const worker = new DeIdentifyIndividualWorker();
  const request = {
    id: uuidv4(),
    handle: Handle,
    groupName: Group,
    sourceIndividualName: SourceIndividual,
    newIndividualName: NewIndividual,
    replacementYear: ReplacementYear,
    redactComments: RedactComments,
  } satisfies DeIdentifyIndividualRequest;

  return new Promise<string[]>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<DeIdentifyIndividualResponse>) => {
      const response = event.data;
      if (response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response.error));
      }
      worker.terminate();
    };
    worker.onerror = (error) => {
      console.error('Worker error:', error);
      reject(new Error('An unexpected worker error occurred while de-identifying the individual.'));
      worker.terminate();
    };
    worker.postMessage(request);
  });
};
