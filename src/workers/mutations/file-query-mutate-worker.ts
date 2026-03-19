import { CleanUpString } from '@/lib/strings';
import { DataExampleFiles } from '@/lib/data';
import { createNewKeySet, serializeKeySet } from '@/lib/keyset';
import { v4 as uuidv4 } from 'uuid';
import { KeySet } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';
import { SavedSessionResult } from '@/lib/dtos';
import { GenerateSavedFileName } from '@/lib/writer';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';

export const DemoDataFolderName = 'Example DataTracker Group';

// Mutation type constants for type safety and extensibility
const MUTATION_TYPES = {
  MUTATE_CONDITIONS: 'MUTATE_CONDITIONS',
  MUTATE_EVALUATIONS: 'MUTATE_EVALUATIONS',
  MUTATE_GROUPS: 'MUTATE_GROUPS',
  MUTATE_INDIVIDUALS: 'MUTATE_INDIVIDUALS',
  MUTATE_KEYSETS: 'MUTATE_KEYSETS',
  MUTATE_SESSION_OUTCOMES: 'MUTATE_SESSION_OUTCOMES',
} as const;

type MutationType = (typeof MUTATION_TYPES)[keyof typeof MUTATION_TYPES];

// Base interfaces for type safety
interface BaseMutationRequest {
  id: string; // Unique ID for request tracking
  type: MutationType;
  timestamp?: number;
}

interface BaseMutationResponse {
  id: string;
  success: boolean;
  timestamp: number;
  executionTime: number;
}

interface SuccessResponse<T = any> extends BaseMutationResponse {
  success: true;
  data: T;
}

interface ErrorResponse extends BaseMutationResponse {
  success: false;
  error: string;
  stack?: string;
}

type MutationResponse<T = any> = SuccessResponse<T> | ErrorResponse;

// Specific mutation request types
interface MutateConditionsRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_CONDITIONS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationName: string;
  conditionName?: string;
  action: 'Add' | 'Clear';
}

interface MutateEvaluationsRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_EVALUATIONS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationNames: string[];
  renameTo?: string;
  action: 'Add' | 'Delete' | 'Duplicate' | 'Rename';
}

interface MutateGroupsRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_GROUPS;
  handle: FileSystemDirectoryHandle;
  groupNames: string[];
  action: 'Add' | 'Delete' | 'Demo';
}

interface MutateIndividualsRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_INDIVIDUALS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualNames: string[];
  action: 'Add' | 'Delete';
}

interface MutateKeysetsRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_KEYSETS;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  keysetNames: string[];
  renameTo?: string;
  newKeySet?: KeySet;
  action: 'Add' | 'Delete' | 'Duplicate' | 'Rename' | 'Update';
}

interface MutateSessionOutcomesRequest extends BaseMutationRequest {
  type: typeof MUTATION_TYPES.MUTATE_SESSION_OUTCOMES;
  handle: FileSystemDirectoryHandle;
  groupName: string;
  individualName: string;
  evaluationName: string;
  outcomes: ModifiedSessionResult[];
  sessionOutcomes: ModifiedSessionResult[];
  conditionRename?: string;
  updatedOutcome?: ModifiedSessionResult;
  priorOutcome?: ModifiedSessionResult;
  newOutcome?: SavedSessionResult;
  action: 'Delete' | 'EditCondition' | 'Modify' | 'Add';
}

type MutationRequest =
  | MutateConditionsRequest
  | MutateEvaluationsRequest
  | MutateGroupsRequest
  | MutateIndividualsRequest
  | MutateKeysetsRequest
  | MutateSessionOutcomesRequest;

// Type-safe createResponse function with overloads
function createResponse<T>(id: string, startTime: number, success: true, data: T): SuccessResponse<T>;

function createResponse(
  id: string,
  startTime: number,
  success: false,
  data: undefined,
  error: string,
  stack?: string,
): ErrorResponse;

function createResponse<T>(
  id: string,
  startTime: number,
  success: boolean,
  data?: T,
  error?: string,
  stack?: string,
): MutationResponse<T> {
  const timestamp = Date.now();
  const executionTime = timestamp - startTime;

  if (success) {
    return {
      id,
      success: true,
      data: data!,
      timestamp,
      executionTime,
    } as SuccessResponse<T>;
  } else {
    return {
      id,
      success: false,
      error: error!,
      stack,
      timestamp,
      executionTime,
    } as ErrorResponse;
  }
}

// Type alias for the createResponse function
type CreateResponseFunction = typeof createResponse;

// Core mutation handlers
async function copyDemoData(handle: FileSystemDirectoryHandle): Promise<void> {
  // Check if demo folder already exists
  const groups: string[] = [];
  for await (const [name, entry] of handle.entries()) {
    if (entry.kind === 'directory' && name !== '.DS_Store') {
      groups.push(name);
    }
  }

  if (groups.includes(DemoDataFolderName)) {
    throw new Error(
      `The ${DemoDataFolderName} folder already exists. Delete it if you'd like to re-load example data.`,
    );
  }

  const folder = await handle.getDirectoryHandle(DemoDataFolderName, { create: true });

  for (const file of DataExampleFiles) {
    const participantId = file.path[0];
    const participantFolder = await folder.getDirectoryHandle(participantId, { create: true });

    let subfolderHandle = participantFolder;

    // Note: Tunnel down to final subfolder
    for (let i = 1; i <= file.path.length - 1; i++) {
      const subfolder = file.path[i];
      subfolderHandle = await subfolderHandle.getDirectoryHandle(subfolder, { create: true });
    }

    const fileHandle = await subfolderHandle.getFileHandle(file.filename!, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(file.text);
    await writable.close();
  }
}

async function copyDirectory(
  sourceDir: FileSystemDirectoryHandle,
  targetDir: FileSystemDirectoryHandle,
): Promise<void> {
  for await (const [name, item] of sourceDir.entries()) {
    if (name === '.DS_Store') continue;

    if (item.kind === 'file') {
      const sourceFile = await sourceDir.getFileHandle(name);
      const targetFile = await targetDir.getFileHandle(name, { create: true });
      const fileData = await sourceFile.getFile();
      const writable = await targetFile.createWritable();
      await writable.write(fileData);
      await writable.close();
    } else if (item.kind === 'directory') {
      const sourceSubDir = await sourceDir.getDirectoryHandle(name);
      const targetSubDir = await targetDir.getDirectoryHandle(name, { create: true });
      await copyDirectory(sourceSubDir, targetSubDir);
    }
  }
}

async function mutateConditions(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  evaluationName: string,
  action: 'Add' | 'Clear',
  conditionName?: string,
): Promise<string[]> {
  try {
    const group_dir = await handle.getDirectoryHandle(CleanUpString(groupName));
    const individual_dir = await group_dir.getDirectoryHandle(CleanUpString(individualName));
    const evaluation_dir = await individual_dir.getDirectoryHandle(CleanUpString(evaluationName));

    // First, get current conditions list
    const conditions: string[] = [];
    for await (const [name, entry] of evaluation_dir.entries()) {
      if (entry.kind === 'directory' && name !== '.DS_Store') {
        conditions.push(name);
      }
    }

    let newConditionsList = [...conditions];

    switch (action) {
      case 'Add':
        if (!conditionName) {
          throw new Error('Condition name is required for Add action');
        }

        await evaluation_dir.getDirectoryHandle(conditionName, { create: true });

        if (!newConditionsList.includes(conditionName)) {
          newConditionsList.push(conditionName);
        }

        break;

      case 'Clear': {
        for await (const [entryName, entry] of evaluation_dir.entries()) {
          if (entry.kind === 'directory' && entryName !== '.DS_Store') {
            const conditionDir = await evaluation_dir.getDirectoryHandle(entryName);
            const entriesInCondition = await conditionDir.values();

            let fileCount = 0;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            for await (const _ of entriesInCondition) {
              fileCount = fileCount + 1;
            }

            if (fileCount === 0) {
              await evaluation_dir.removeEntry(entryName, { recursive: true });
              newConditionsList = newConditionsList.filter((cond) => cond !== entryName);
            }
          }
        }
        break;
      }
    }

    return newConditionsList;
  } catch (error) {
    console.error('Error mutating conditions:', error);
    throw error;
  }
}

async function mutateEvaluations(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  evaluationNames: string[],
  action: 'Add' | 'Delete' | 'Duplicate' | 'Rename',
  renameTo?: string,
): Promise<string[]> {
  try {
    const group_dir = await handle.getDirectoryHandle(CleanUpString(groupName));
    const individual_dir = await group_dir.getDirectoryHandle(CleanUpString(individualName));

    // First, get current evaluations list
    const evaluations: string[] = [];
    for await (const [name, entry] of individual_dir.entries()) {
      if (entry.kind === 'directory' && name !== '.DS_Store') {
        evaluations.push(name);
      }
    }

    let newEvaluationsList = [...evaluations];

    switch (action) {
      case 'Add':
        await individual_dir.getDirectoryHandle(evaluationNames[0], { create: true });
        if (!newEvaluationsList.includes(evaluationNames[0])) {
          newEvaluationsList.push(evaluationNames[0]);
        }
        break;

      case 'Delete':
        for (const evaluationName of evaluationNames) {
          await individual_dir.removeEntry(evaluationName, { recursive: true });
          newEvaluationsList = newEvaluationsList.filter((e) => e !== evaluationName);
        }
        break;

      case 'Duplicate': {
        if (!renameTo) {
          throw new Error('renameTo is required for Duplicate action');
        }

        const sourceEvalDir = await individual_dir.getDirectoryHandle(evaluationNames[0]);
        const targetEvalDir = await individual_dir.getDirectoryHandle(renameTo, { create: true });
        await copyDirectory(sourceEvalDir, targetEvalDir);

        if (!newEvaluationsList.includes(renameTo)) {
          newEvaluationsList.push(renameTo);
        }
        break;
      }

      case 'Rename': {
        if (!renameTo) {
          throw new Error('renameTo is required for Rename action');
        }

        const sourceEvalDir = await individual_dir.getDirectoryHandle(evaluationNames[0]);
        const targetEvalDir = await individual_dir.getDirectoryHandle(renameTo, { create: true });
        await copyDirectory(sourceEvalDir, targetEvalDir);

        // Delete the original
        await individual_dir.removeEntry(evaluationNames[0], { recursive: true });

        // Update the list
        newEvaluationsList = newEvaluationsList.map((e) => (e === evaluationNames[0] ? renameTo : e));
        break;
      }
    }

    return newEvaluationsList;
  } catch (error) {
    console.error('Error mutating evaluations:', error);
    throw error;
  }
}

async function mutateGroups(
  handle: FileSystemDirectoryHandle,
  groupNames: string[],
  action: 'Add' | 'Delete' | 'Demo',
): Promise<string[]> {
  try {
    // First, get current groups list
    const groups: string[] = [];
    for await (const [name, entry] of handle.entries()) {
      if (entry.kind === 'directory' && name !== '.DS_Store') {
        groups.push(name);
      }
    }

    let newGroups = [...groups];

    switch (action) {
      case 'Add':
        await handle.getDirectoryHandle(groupNames[0], { create: true });
        if (!newGroups.includes(groupNames[0])) {
          newGroups.push(groupNames[0]);
        }
        break;

      case 'Delete':
        await handle.removeEntry(groupNames[0], { recursive: true });
        newGroups = newGroups.filter((g) => g !== groupNames[0]);
        break;

      case 'Demo':
        await copyDemoData(handle);
        if (!newGroups.includes(DemoDataFolderName)) {
          newGroups.push(DemoDataFolderName);
        }
        break;
    }

    return newGroups;
  } catch (error) {
    console.error('Error mutating groups:', error);
    throw error;
  }
}

async function mutateIndividuals(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualNames: string[],
  action: 'Add' | 'Delete',
): Promise<string[]> {
  try {
    const group_dir = await handle.getDirectoryHandle(CleanUpString(groupName));

    // First, get current individuals list
    const individuals: string[] = [];
    for await (const [name, entry] of group_dir.entries()) {
      if (entry.kind === 'directory' && name !== '.DS_Store') {
        individuals.push(name);
      }
    }

    let newIndividualList = [...individuals];

    switch (action) {
      case 'Add':
        await group_dir.getDirectoryHandle(individualNames[0], { create: true });
        if (!newIndividualList.includes(individualNames[0])) {
          newIndividualList.push(individualNames[0]);
        }
        break;

      case 'Delete':
        for (const individualName of individualNames) {
          await group_dir.removeEntry(individualName, { recursive: true });
          newIndividualList = newIndividualList.filter((i) => i !== individualName);
        }
        break;
    }

    return newIndividualList;
  } catch (error) {
    console.error('Error mutating individuals:', error);
    throw error;
  }
}

async function mutateKeysets(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  keysetNames: string[],
  action: 'Add' | 'Delete' | 'Duplicate' | 'Rename' | 'Update',
  renameTo?: string,
  newKeySet?: KeySet,
): Promise<KeySet[]> {
  try {
    const group_dir = await handle.getDirectoryHandle(CleanUpString(groupName));
    const individual_dir = await group_dir.getDirectoryHandle(individualName);

    // First, get current keysets list
    const keysets: KeySet[] = [];
    for await (const [name, entry] of individual_dir.entries()) {
      if (entry.kind === 'file' && name.endsWith('.json') && name !== '.DS_Store') {
        try {
          const fileHandle = await individual_dir.getFileHandle(name);
          const file = await fileHandle.getFile();
          const text = await file.text();
          if (text.length > 0) {
            const keysetData = JSON.parse(text) as KeySet;
            keysets.push(keysetData);
          }
        } catch (error) {
          console.error(`Error reading keyset file ${name}:`, error);
        }
      }
    }

    let newKeysetsList = [...keysets];

    switch (action) {
      case 'Add': {
        const key_set = createNewKeySet(keysetNames[0]);

        const key_board = await individual_dir.getFileHandle(`${keysetNames[0]}.json`, { create: true });
        const writer = await key_board.createWritable();
        await writer.write(serializeKeySet(key_set));
        await writer.close();
        newKeysetsList = [...newKeysetsList, key_set];
        break;
      }

      case 'Delete':
        for (const keysetName of keysetNames) {
          try {
            const fileHandle = await individual_dir.getFileHandle(`${keysetName}.json`);
            await individual_dir.removeEntry(fileHandle.name);
            newKeysetsList = newKeysetsList.filter((e) => e.Name !== keysetName);
          } catch (error) {
            // eslint-disable-next-line preserve-caught-error
            throw new Error(`Failed to remove keyboard: ${keysetName}.json`);
          }
        }
        break;

      case 'Duplicate': {
        const keySetMatch = keysets.find((ks) => ks.Name === keysetNames[0].trim());
        console.log(keySetMatch);
        console.log('Duplicate action - keySetMatch:', keysetNames[0], 'renameTo:', renameTo);

        if (!keySetMatch) {
          throw new Error('No matching KeySet found.');
        }
        if (!renameTo) {
          throw new Error('No renameTo text supplied.');
        }

        const key_set = {
          ...keySetMatch,
          Name: renameTo,
          id: uuidv4(),
          createdAt: new Date(),
          lastModified: new Date(),
        };

        const key_board = await individual_dir.getFileHandle(`${renameTo}.json`, { create: true });
        const writer = await key_board.createWritable();
        await writer.write(serializeKeySet(key_set));
        await writer.close();
        newKeysetsList = [...newKeysetsList, key_set];
        break;
      }

      case 'Update': {
        if (!newKeySet) {
          throw new Error('newKeySet not supplied');
        }

        const key_board = await individual_dir.getFileHandle(`${newKeySet.Name}.json`);
        const writer = await key_board.createWritable();
        await writer.write(serializeKeySet(newKeySet));
        await writer.close();

        newKeysetsList = newKeysetsList.map((k) => {
          if (k.Name === newKeySet.Name) {
            return newKeySet;
          }
          return k;
        });
        break;
      }

      case 'Rename': {
        // TODO: Implement rename functionality in future
        throw new Error('Rename action not yet implemented');
      }
    }

    return newKeysetsList;
  } catch (error) {
    console.error('Error mutating keysets:', error);
    throw error;
  }
}

async function mutateSessionOutcomes(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  evaluationName: string,
  outcomes: ModifiedSessionResult[],
  sessionOutcomes: ModifiedSessionResult[],
  action: 'Delete' | 'EditCondition' | 'Modify' | 'Add',
  conditionRename?: string,
  updatedOutcome?: ModifiedSessionResult,
  priorOutcome?: ModifiedSessionResult,
  newOutcome?: SavedSessionResult,
): Promise<ModifiedSessionResult[]> {
  try {
    const group_dir = await handle.getDirectoryHandle(CleanUpString(groupName));
    const individual_dir = await group_dir.getDirectoryHandle(individualName);
    const evaluation_dir = await individual_dir.getDirectoryHandle(evaluationName);

    let cleanedSessionOutcomes: ModifiedSessionResult[] = sessionOutcomes;

    switch (action) {
      case 'Delete': {
        let modifiedArray = cleanedSessionOutcomes;

        for (const outcome of outcomes) {
          const condition_dir = await evaluation_dir
            .getDirectoryHandle(outcome.SessionSettings.Condition, { create: false })
            .catch(() => null);

          if (condition_dir) {
            await condition_dir.removeEntry(outcome.Filename).catch(() => null);
            modifiedArray = modifiedArray.filter((row) => row.Filename !== outcome.Filename);
          }
        }

        cleanedSessionOutcomes = modifiedArray;
        break;
      }

      case 'EditCondition': {
        if (!conditionRename) throw new Error('Condition rename value not provided');

        const newConditionFolderHandle = await evaluation_dir.getDirectoryHandle(conditionRename.trim(), {
          create: true,
        });

        const file_names_to_move = outcomes.map((row) => row.Filename);
        const new_session_files: ModifiedSessionResult[] = [];

        for await (const filename of await evaluation_dir.values()) {
          if (filename.kind === 'directory') {
            const condition_folder = await evaluation_dir.getDirectoryHandle(filename.name);

            for await (const sub_dir_file of await condition_folder.values()) {
              if (file_names_to_move.includes(sub_dir_file.name)) {
                const relevant_result = outcomes.find((r) => r.Filename === sub_dir_file.name);

                if (!relevant_result) continue;

                const new_object = { ...relevant_result };
                new_object.SessionSettings.Condition = conditionRename.trim();

                const new_file_name = GenerateSavedFileName(new_object.SessionSettings);
                const new_file_handle = await newConditionFolderHandle.getFileHandle(new_file_name, {
                  create: true,
                });

                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { Filename, ...ModifiedResult } = relevant_result;

                const writer = await new_file_handle.createWritable();
                await writer.write(JSON.stringify(ModifiedResult));
                await writer.close();

                const file_to_add = { ...new_object, Filename: new_file_name };
                new_session_files.push(file_to_add);

                await condition_folder.removeEntry(sub_dir_file.name);
              }
            }
          }
        }

        cleanedSessionOutcomes = cleanedSessionOutcomes
          .filter((r) => !file_names_to_move.includes(r.Filename))
          .concat(new_session_files)
          .sort(
            (a, b) => new Date(b.SessionSettings.Session).valueOf() - new Date(a.SessionSettings.Session).valueOf(),
          );
        break;
      }

      case 'Modify': {
        if (!updatedOutcome || !priorOutcome) {
          throw new Error('Updated outcome not found');
        }

        const indexOfOutcome = sessionOutcomes.indexOf(priorOutcome);

        if (indexOfOutcome == -1) {
          throw new Error('Original outcome not found');
        }

        try {
          const condition_dir = await evaluation_dir.getDirectoryHandle(
            CleanUpString(updatedOutcome.SessionSettings.Condition),
            {
              create: true,
            },
          );

          const session_output_file = await condition_dir.getFileHandle(priorOutcome.Filename, {
            create: false,
          });

          const writer = await session_output_file.createWritable();
          await writer.write(JSON.stringify(updatedOutcome));
          await writer.close();

          cleanedSessionOutcomes[indexOfOutcome] = updatedOutcome;
        } catch (error: unknown) {
          // eslint-disable-next-line preserve-caught-error
          throw new Error(`Failed to update outcome: ${error}`);
        }

        break;
      }

      case 'Add': {
        if (!newOutcome) {
          throw new Error('New outcome not found');
        }

        const Filename = GenerateSavedFileName(newOutcome.SessionSettings);

        const savedResult = {
          ...newOutcome,
          Filename,
        } satisfies ModifiedSessionResult;

        try {
          const condition_dir = await evaluation_dir.getDirectoryHandle(
            CleanUpString(newOutcome.SessionSettings.Condition),
            {
              create: true,
            },
          );

          const session_output_file = await condition_dir.getFileHandle(savedResult.Filename, {
            create: true,
          });

          const writer = await session_output_file.createWritable();
          await writer.write(JSON.stringify(savedResult));
          await writer.close();

          cleanedSessionOutcomes.unshift(savedResult);
        } catch (error: unknown) {
          // eslint-disable-next-line preserve-caught-error
          throw new Error(`Failed to add outcome: ${error}`);
        }

        break;
      }
    }

    return cleanedSessionOutcomes;
  } catch (error) {
    console.error('Error mutating session outcomes:', error);
    throw error;
  }
}

// Mutation dispatcher - maps mutation types to handlers
const mutationHandlers: Record<MutationType, (request: any) => Promise<any>> = {
  [MUTATION_TYPES.MUTATE_CONDITIONS]: (req: MutateConditionsRequest) =>
    mutateConditions(req.handle, req.groupName, req.individualName, req.evaluationName, req.action, req.conditionName),

  [MUTATION_TYPES.MUTATE_EVALUATIONS]: (req: MutateEvaluationsRequest) =>
    mutateEvaluations(req.handle, req.groupName, req.individualName, req.evaluationNames, req.action, req.renameTo),

  [MUTATION_TYPES.MUTATE_GROUPS]: (req: MutateGroupsRequest) => mutateGroups(req.handle, req.groupNames, req.action),

  [MUTATION_TYPES.MUTATE_INDIVIDUALS]: (req: MutateIndividualsRequest) =>
    mutateIndividuals(req.handle, req.groupName, req.individualNames, req.action),

  [MUTATION_TYPES.MUTATE_KEYSETS]: (req: MutateKeysetsRequest) =>
    mutateKeysets(
      req.handle,
      req.groupName,
      req.individualName,
      req.keysetNames,
      req.action,
      req.renameTo,
      req.newKeySet,
    ),

  [MUTATION_TYPES.MUTATE_SESSION_OUTCOMES]: (req: MutateSessionOutcomesRequest) =>
    mutateSessionOutcomes(
      req.handle,
      req.groupName,
      req.individualName,
      req.evaluationName,
      req.outcomes,
      req.sessionOutcomes,
      req.action,
      req.conditionRename,
      req.updatedOutcome,
      req.priorOutcome,
      req.newOutcome,
    ),
};

// Main message handler
self.onmessage = async (event: MessageEvent<MutationRequest>) => {
  const startTime = Date.now();
  const request = event.data;

  // Validate request structure
  if (!request || !request.id || !request.type) {
    const response = createResponse(
      request?.id || 'unknown',
      startTime,
      false,
      undefined,
      'Invalid request: missing id or type',
    );
    self.postMessage(response);
    return;
  }

  try {
    // Get the appropriate handler
    const handler = mutationHandlers[request.type];
    if (!handler) {
      throw new Error(`Unsupported mutation type: ${request.type}`);
    }

    // Execute the mutation
    const result = await handler(request);

    // Send success response
    const response = createResponse(request.id, startTime, true, result);
    self.postMessage(response);
  } catch (error) {
    // Send error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const stack = error instanceof Error ? error.stack : undefined;

    const response = createResponse(request.id, startTime, false, undefined, errorMessage, stack);
    self.postMessage(response);
  }
};

// Export types for main thread usage (if using TypeScript modules)
export type {
  MutationType,
  MutationRequest,
  MutationResponse,
  SuccessResponse,
  ErrorResponse,
  BaseMutationResponse,
  MutateConditionsRequest,
  MutateEvaluationsRequest,
  MutateGroupsRequest,
  MutateIndividualsRequest,
  MutateKeysetsRequest,
  MutateSessionOutcomesRequest,
  CreateResponseFunction,
};

export { MUTATION_TYPES, createResponse };
