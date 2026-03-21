import { CleanUpString } from '@/lib/strings';
import { DataExampleFiles } from '@/lib/data';
import { createNewKeySet, serializeKeySet } from '@/lib/keyset';
import { v4 as uuidv4 } from 'uuid';
import { KeySet, KeySetExtended } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';
import { SavedSessionResult, SavedSettings } from '@/lib/dtos';
import { GenerateSavedFileName } from '@/lib/writer';
import { EvaluationRecord } from '@/queries/keysets/types/evaluation-record';
import { importExistingKeysets } from '@/queries/keysets/helpers/import-keysets';

export const DemoDataFolderName = 'Example DataTracker Group';

/**
 * Utility function to copy demo data into user's file system. Checks for existing demo folder to prevent overwriting.
 *
 * @param handle - The FileSystemDirectoryHandle representing the root directory where the demo data should be copied.
 * @returns A promise that resolves when the copying is complete, or rejects if the demo folder already exists or if any error occurs during copying.
 */
export async function copyDemoData(handle: FileSystemDirectoryHandle): Promise<void> {
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

/**
 * Recursively copies all files and directories from a source directory to a target directory.
 * Excludes .DS_Store files from the copying process.
 *
 * @param sourceDir - The FileSystemDirectoryHandle representing the source directory to copy from.
 * @param targetDir - The FileSystemDirectoryHandle representing the target directory to copy to.
 * @returns A promise that resolves when the copying is complete, or rejects if any error occurs during copying.
 */
export async function copyDirectory(
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

/**
 * Mutates conditions within an evaluation by adding new conditions or clearing empty ones.
 * Supports 'Add' action to create a new condition directory and 'Clear' action to remove empty condition directories.
 *
 * @param handle - The FileSystemDirectoryHandle representing the root directory.
 * @param groupName - The name of the group containing the evaluation.
 * @param individualName - The name of the individual containing the evaluation.
 * @param evaluationName - The name of the evaluation containing the conditions.
 * @param action - The action to perform: 'Add' to create a new condition, 'Clear' to remove empty conditions.
 * @param conditionName - Optional condition name required for 'Add' action.
 * @returns A promise that resolves to an array of condition names after the mutation is complete.
 */
export async function mutateConditions(
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

/**
 * Mutates evaluations for a specific individual by performing various operations.
 * Supports Add, Delete, Duplicate, and Rename actions on evaluation directories.
 *
 * @param handle - The FileSystemDirectoryHandle representing the root directory.
 * @param groupName - The name of the group containing the individual.
 * @param individualName - The name of the individual containing the evaluations.
 * @param evaluationNames - An array of evaluation names to operate on (typically contains one name).
 * @param action - The action to perform: 'Add', 'Delete', 'Duplicate', or 'Rename'.
 * @param renameTo - Optional new name required for 'Duplicate' and 'Rename' actions.
 * @returns A promise that resolves to an array of evaluation names after the mutation is complete.
 */
export async function mutateEvaluations(
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

/**
 * Mutates groups in the root directory by performing various operations.
 * Supports Add, Delete, and Demo actions on group directories.
 *
 * @param handle - The FileSystemDirectoryHandle representing the root directory.
 * @param groupNames - An array of group names to operate on (typically contains one name).
 * @param action - The action to perform: 'Add' to create a new group, 'Delete' to remove a group, 'Demo' to add demo data.
 * @returns A promise that resolves to an array of group names after the mutation is complete.
 */
export async function mutateGroups(
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
        for (const groupName of groupNames) {
          await handle.removeEntry(groupName, { recursive: true });
          newGroups = newGroups.filter((g) => g !== groupName);
        }
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

/**
 * Mutates individuals within a group by performing Add or Delete operations.
 * Creates or removes individual directories within the specified group.
 *
 * @param handle - The FileSystemDirectoryHandle representing the root directory.
 * @param groupName - The name of the group containing the individuals.
 * @param individualNames - An array of individual names to operate on.
 * @param action - The action to perform: 'Add' to create new individuals, 'Delete' to remove individuals.
 * @returns A promise that resolves to an array of individual names after the mutation is complete.
 */
export async function mutateIndividuals(
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

/**
 * Mutates keysets for a specific individual by performing various operations on JSON keyset files.
 * Supports Add, Delete, Duplicate, Update, and Rename actions. Reads existing keysets from JSON files.
 *
 * @param handle - The FileSystemDirectoryHandle representing the root directory.
 * @param groupName - The name of the group containing the individual.
 * @param individualName - The name of the individual containing the keysets.
 * @param keysetNames - An array of keyset names to operate on.
 * @param action - The action to perform: 'Add', 'Delete', 'Duplicate', 'Rename', or 'Update'.
 * @param renameTo - Optional new name required for 'Duplicate' action.
 * @param newKeySet - Optional KeySet object required for 'Update' action.
 * @returns A promise that resolves to an array of KeySet objects after the mutation is complete.
 */
export async function mutateKeysets(
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

/**
 * Mutates system-wide keysets by importing new keysets and filtering out duplicates.
 * Used for importing keysets across the entire system while avoiding conflicts.
 *
 * @param handle - The FileSystemDirectoryHandle representing the root directory.
 * @param groupName - The name of the group where keysets will be imported.
 * @param individualName - The name of the individual where keysets will be imported.
 * @param keySets - An array of KeySet objects to import.
 * @param allKeySets - An array of all existing KeySetExtended objects in the system.
 * @returns A promise that resolves to a filtered array of KeySetExtended objects excluding duplicates and the target individual's keysets.
 */
export async function mutateKeysetsAll(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  keySets: KeySet[],
  allKeySets: KeySetExtended[],
): Promise<KeySetExtended[]> {
  try {
    const newKeySets = await importExistingKeysets(handle, groupName, individualName, keySets);
    const client_keyboards_by_name = newKeySets.map((keyboard) => keyboard.Name);

    return allKeySets.filter(
      (keyboard) => keyboard.Individual !== individualName && !client_keyboards_by_name.includes(keyboard.Name),
    );
  } catch (error) {
    console.error('Error mutating keysets all:', error);
    throw error;
  }
}

/**
 * Creates a duplicate evaluation record by setting up the directory structure and conditions.
 * Used internally by mutateEvaluationsAll to import evaluation structures.
 *
 * @param handle - The FileSystemDirectoryHandle representing the root directory.
 * @param groupName - The name of the group where the evaluation will be duplicated.
 * @param individualName - The name of the individual where the evaluation will be duplicated.
 * @param evaluation - The EvaluationRecord object containing evaluation details to duplicate.
 * @returns A promise that resolves to a new EvaluationRecord object representing the duplicated evaluation.
 */
export async function duplicateEvaluationRecord(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  evaluation: EvaluationRecord,
): Promise<EvaluationRecord> {
  try {
    const g_folder = await handle.getDirectoryHandle(groupName);
    const i_folder = await g_folder.getDirectoryHandle(individualName);
    const e_folder = await i_folder.getDirectoryHandle(evaluation.Evaluation, { create: true });

    const conditionList: string[] = [];

    for (const condition of evaluation.Conditions) {
      await e_folder.getDirectoryHandle(condition, { create: true });
      conditionList.push(condition);
    }

    return {
      Group: groupName,
      Individual: individualName,
      Evaluation: evaluation.Evaluation,
      Conditions: conditionList,
    } satisfies EvaluationRecord;
  } catch (error) {
    console.error('Error duplicating evaluation record:', error);
    throw error;
  }
}

/**
 * Mutates system-wide evaluations by importing evaluation records.
 * Currently supports 'Import' action to duplicate evaluations across the system.
 *
 * @param handle - The FileSystemDirectoryHandle representing the root directory.
 * @param groupName - The name of the group where evaluations will be imported.
 * @param individualName - The name of the individual where evaluations will be imported.
 * @param action - The action to perform, currently only 'Import' is supported.
 * @param allRecords - An array of all existing EvaluationRecord objects in the system.
 * @param relevantRecords - Optional array of specific EvaluationRecord objects to import.
 * @returns A promise that resolves to an updated array of EvaluationRecord objects after the import.
 */
export async function mutateEvaluationsAll(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  action: 'Import',
  allRecords: EvaluationRecord[],
  relevantRecords?: EvaluationRecord[],
): Promise<EvaluationRecord[]> {
  try {
    const newEvaluationRecordsList = [...(allRecords ?? [])];

    switch (action) {
      case 'Import': {
        for (const evaluation of relevantRecords ?? []) {
          const newEntry = await duplicateEvaluationRecord(handle, groupName, individualName, evaluation);
          newEvaluationRecordsList.push(newEntry);
        }
        break;
      }
    }

    return newEvaluationRecordsList;
  } catch (error) {
    console.error('Error mutating evaluations all:', error);
    throw error;
  }
}

/**
 * Mutates session outcomes by performing various operations on session result files.
 * Supports Delete, EditCondition, Modify, and Add actions for managing session outcome data.
 *
 * @param handle - The FileSystemDirectoryHandle representing the root directory.
 * @param groupName - The name of the group containing the evaluation.
 * @param individualName - The name of the individual containing the evaluation.
 * @param evaluationName - The name of the evaluation containing the session outcomes.
 * @param outcomes - An array of ModifiedSessionResult objects to operate on.
 * @param sessionOutcomes - The current array of all session outcomes for context.
 * @param action - The action to perform: 'Delete', 'EditCondition', 'Modify', or 'Add'.
 * @param conditionRename - Optional new condition name required for 'EditCondition' action.
 * @param updatedOutcome - Optional ModifiedSessionResult required for 'Modify' action.
 * @param priorOutcome - Optional original ModifiedSessionResult required for 'Modify' action.
 * @param newOutcome - Optional SavedSessionResult required for 'Add' action.
 * @returns A promise that resolves to an updated array of ModifiedSessionResult objects after the mutation.
 */
export async function mutateSessionOutcomes(
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

/**
 * Mutates session parameters by updating the settings.json file for a specific evaluation.
 * Overwrites the existing settings file with the new settings data.
 *
 * @param handle - The FileSystemDirectoryHandle representing the root directory.
 * @param groupName - The name of the group containing the evaluation.
 * @param individualName - The name of the individual containing the evaluation.
 * @param evaluationName - The name of the evaluation to update settings for.
 * @param settings - The SavedSettings object containing the new settings to write.
 * @returns A promise that resolves to the SavedSettings object that was written to the file.
 */
export async function mutateSessionParams(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  evaluationName: string,
  settings: SavedSettings,
): Promise<SavedSettings> {
  try {
    const group_dir = await handle.getDirectoryHandle(CleanUpString(groupName));
    const individual_dir = await group_dir.getDirectoryHandle(CleanUpString(individualName));
    const evaluation_dir = await individual_dir.getDirectoryHandle(CleanUpString(evaluationName));

    const settings_file = await evaluation_dir.getFileHandle('settings.json', {
      create: true,
    });

    const writer = await settings_file.createWritable();
    await writer.write(JSON.stringify(settings));
    await writer.close();

    return settings;
  } catch (error) {
    console.error('Error mutating session params:', error);
    throw error;
  }
}
