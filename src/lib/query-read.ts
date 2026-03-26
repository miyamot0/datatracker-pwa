import { deserializeKeySet } from '@/lib/keyset';
import { CleanUpString } from '@/lib/strings';
import { KeySet, KeySetExtended } from '@/types/keyset';
import { DEFAULT_SESSION_SETTINGS, SavedSettings, SavedSessionResult } from '@/lib/dtos';
import { ModifiedSessionResult } from '@/types/storage';
import { EvaluationRecord } from '@/queries/keysets/types/evaluation-record';
import { readKeyboardParameters } from '@/lib/reader';

/**
 * Checks if a file/directory name represents a system file that should be excluded
 * @param name - The name of the file or directory to check
 * @returns True if the file is a system file and should be excluded
 */
export const isSystemFile = (name: string): boolean => {
  return name.startsWith('.') || ['Thumbs.db', 'desktop.ini'].includes(name);
};

/**
 * Fetches directory names from a specified path within a file system directory handle
 * @param handle - The root directory handle to search from
 * @param options - Optional filtering and navigation options
 * @param options.path - Array of path segments to navigate to before listing directories
 * @param options.filterPattern - Regular expression to filter directory names
 * @param options.excludeSystemFiles - Whether to exclude system files (default: true)
 * @returns Promise resolving to sorted array of directory names
 */
export async function fetchDirectories(
  handle: FileSystemDirectoryHandle,
  options?: {
    path?: string[];
    filterPattern?: RegExp;
    excludeSystemFiles?: boolean;
  },
): Promise<string[]> {
  const { path = [], filterPattern, excludeSystemFiles = true } = options || {};

  let currentHandle = handle;

  // Navigate to the specified path
  for (const segment of path) {
    try {
      currentHandle = await currentHandle.getDirectoryHandle(segment);
    } catch {
      return []; // Path doesn't exist
    }
  }

  const directories: string[] = [];

  try {
    for await (const [name, entry] of currentHandle.entries()) {
      if (entry.kind !== 'directory') continue;

      if (excludeSystemFiles && isSystemFile(name)) continue;

      if (filterPattern && !filterPattern.test(name)) continue;

      directories.push(name);
    }

    return directories.sort(); // Return sorted for consistency
  } catch (error) {
    console.error('Error fetching directories:', error);
    return [];
  }
}

/**
 * Fetches all group names from the root directory
 * @param handle - The root directory handle containing groups
 * @returns Promise resolving to array of group names
 */
export async function fetchGroups(handle: FileSystemDirectoryHandle): Promise<string[]> {
  return fetchDirectories(handle, { excludeSystemFiles: true });
}

/**
 * Fetches all client names within a specific group
 * @param handle - The root directory handle
 * @param groupName - The name of the group to search within
 * @returns Promise resolving to array of client names
 */
export async function fetchClients(handle: FileSystemDirectoryHandle, groupName: string): Promise<string[]> {
  return fetchDirectories(handle, {
    path: [groupName],
    excludeSystemFiles: true,
  });
}

/**
 * Fetches evaluation names for a specific group and optionally a specific client
 * @param handle - The root directory handle
 * @param groupName - The name of the group to search within
 * @param clientName - Optional client name to limit search to specific client
 * @returns Promise resolving to array of evaluation names
 */
export async function fetchEvaluations(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  clientName?: string,
): Promise<string[]> {
  const path = clientName ? [groupName, clientName] : [groupName];
  return fetchDirectories(handle, {
    path,
    excludeSystemFiles: true,
  });
}

/**
 * Fetches all evaluation records from the entire filesystem structure
 * @param handle - The root directory handle to search from
 * @returns Promise resolving to array of evaluation records with group, individual, evaluation, and condition data
 */
export async function fetchEvaluationsAll(handle: FileSystemDirectoryHandle): Promise<EvaluationRecord[]> {
  try {
    const temp_evaluation_folders: EvaluationRecord[] = [];

    for await (const [groupName, possibleGroupFolder] of handle.entries()) {
      if (groupName === '.DS_Store') continue;

      if (possibleGroupFolder.kind === 'directory') {
        // Note: This is for the Group folder
        const actualGroupFolderHandle = await handle.getDirectoryHandle(groupName);

        for await (const [individualName, possibleIndividualFolder] of actualGroupFolderHandle.entries()) {
          if (individualName === '.DS_Store') continue;

          if (possibleIndividualFolder.kind === 'directory') {
            // Note: This is for the Individual's folder
            const actualIndividualFolderHandle = await actualGroupFolderHandle.getDirectoryHandle(individualName);

            for await (const [evaluationName, possibleEvaluationFolder] of actualIndividualFolderHandle.entries()) {
              if (evaluationName === '.DS_Store') continue;

              if (possibleEvaluationFolder.kind === 'directory') {
                const actualEvaluationFolderHandle =
                  await actualIndividualFolderHandle.getDirectoryHandle(evaluationName);
                const conditions: string[] = [];

                for await (const [conditionName, condition_entry] of actualEvaluationFolderHandle.entries()) {
                  if (conditionName === '.DS_Store') continue;
                  if (condition_entry.kind === 'file') continue;

                  if (condition_entry.kind === 'directory') {
                    conditions.push(conditionName);
                  }
                }

                const eval_record: EvaluationRecord = {
                  Group: groupName,
                  Individual: individualName,
                  Evaluation: evaluationName,
                  Conditions: conditions,
                };

                temp_evaluation_folders.push(eval_record);
              }
            }
          }
        }
      }
    }

    return temp_evaluation_folders;
  } catch (error) {
    console.error('Error fetching all evaluations:', error);
    return [];
  }
}

/**
 * Fetches all condition names for a specific evaluation
 * @param handle - The root directory handle
 * @param groupName - The group name containing the evaluation
 * @param individualName - The individual name containing the evaluation
 * @param evaluationName - The evaluation name to fetch conditions for
 * @returns Promise resolving to array of condition names
 */
export async function fetchConditions(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  evaluationName: string,
): Promise<string[]> {
  const conditions: string[] = [];

  try {
    const group_folder = await handle.getDirectoryHandle(CleanUpString(groupName));
    const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(individualName));
    const evaluations = await individual_folder.getDirectoryHandle(CleanUpString(evaluationName));

    for await (const [name, entry] of evaluations.entries()) {
      if (entry.kind === 'directory' && name !== '.DS_Store') {
        conditions.push(name);
      }
    }

    return conditions;
  } catch (error) {
    console.error('Error fetching conditions:', error);
    return [];
  }
}

/**
 * Fetches all keyset configurations for a specific group and individual
 * @param handle - The root directory handle
 * @param groupName - The group name containing the individual
 * @param individualName - The individual name to fetch keysets for
 * @returns Promise resolving to array of KeySet objects containing keyboard configurations
 */
export async function fetchKeysets(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
): Promise<KeySet[]> {
  const keysets: KeySet[] = [];

  try {
    const individuals_folder = await handle.getDirectoryHandle(CleanUpString(groupName), { create: true });
    const keyboards_folder = await individuals_folder.getDirectoryHandle(CleanUpString(individualName), {
      create: true,
    });

    for await (const [name, entry] of keyboards_folder.entries()) {
      if (name === '.DS_Store') continue;

      if (entry.kind === 'file' && name.endsWith('.json')) {
        const keyset = await entry.getFile();
        const keyset_text = await keyset.text();

        if (keyset_text.length === 0) continue;

        const keyset_json = deserializeKeySet(keyset_text);

        if (keyset_json) {
          keysets.push(keyset_json);
        }
      }
    }

    return keysets;
  } catch (error) {
    console.error('Error fetching keysets:', error);
    return [];
  }
}

/**
 * Fetches all keysets from the entire system excluding those belonging to the specified individual
 * @param handle - The root directory handle to search from
 * @param groupName - The group name for filtering client keysets
 * @param individualName - The individual name whose keysets should be excluded from the result
 * @returns Promise resolving to array of extended KeySet objects with group and individual metadata
 */
export async function fetchKeysetsAll(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
): Promise<KeySetExtended[]> {
  let keysets: KeySetExtended[] = [];

  try {
    for await (const [groupFolderName, groupFolderEntry] of handle.entries()) {
      if (groupFolderEntry.kind !== 'directory') continue;
      if (groupFolderName === '.DS_Store') continue;

      const group_dir_handle = await handle.getDirectoryHandle(CleanUpString(groupFolderName), {
        create: false,
      });

      // Note: CLIENTS
      for await (const [clientName, client_entry] of group_dir_handle.entries()) {
        if (client_entry.kind !== 'directory') continue;
        if (clientName === '.DS_Store') continue;

        const keyboards_folder = await group_dir_handle.getDirectoryHandle(CleanUpString(clientName), {
          create: false,
        });

        // Note: KEYBOARDS
        for await (const [kbName, kb_entry] of keyboards_folder.entries()) {
          if (kb_entry.kind === 'directory') continue;
          if (kbName === '.DS_Store') continue;

          if (kbName.includes('.json')) {
            try {
              const keyset_obj = await readKeyboardParameters(kb_entry);

              if (keyset_obj) {
                keysets.push({
                  ...keyset_obj,
                  Group: CleanUpString(groupFolderName),
                  Individual: CleanUpString(clientName),
                } satisfies KeySetExtended);
              }
            } catch (error) {
              console.error(`Error reading keyboard ${kbName}:`, error);
            }
          }
        }
      }
    }

    const clientKeyboards = keysets.filter(
      (keyboard) => keyboard.Group === groupName && keyboard.Individual === individualName,
    );

    const clientKeyboardNames = clientKeyboards.map((keyboard) => keyboard.Name);

    keysets = keysets.filter(
      (keyboard) => keyboard.Individual !== individualName && !clientKeyboardNames.includes(keyboard.Name),
    );

    return keysets;
  } catch (error) {
    console.error('Error fetching all keysets:', error);
    return [];
  }
}

/**
 * Fetches session parameters/settings for a specific evaluation
 * @param handle - The root directory handle
 * @param groupName - The group name containing the evaluation
 * @param individualName - The individual name containing the evaluation
 * @param evaluationName - The evaluation name to fetch settings for
 * @returns Promise resolving to SavedSettings object, defaults created if not found
 */
export async function fetchSessionParams(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  evaluationName: string,
): Promise<SavedSettings> {
  try {
    const group_folder = await handle.getDirectoryHandle(CleanUpString(groupName));
    const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(individualName));
    const evaluations = await individual_folder.getDirectoryHandle(CleanUpString(evaluationName));

    try {
      const settings_file = await evaluations.getFileHandle('settings.json');
      const settings = await settings_file.getFile();
      const settings_text = await settings.text();
      const settings_json = JSON.parse(settings_text) as SavedSettings;

      if (!settings_json) throw new Error('Settings file not well-formed');

      return settings_json;
    } catch {
      // Create default settings file if not found
      try {
        const file = await evaluations.getFileHandle('settings.json', { create: true });
        const writer = await file.createWritable();
        await writer.write(JSON.stringify(DEFAULT_SESSION_SETTINGS));
        await writer.close();
      } catch {
        console.error('Error creating default settings file');
      }

      return DEFAULT_SESSION_SETTINGS;
    }
  } catch {
    console.error('Error fetching session params');
    return DEFAULT_SESSION_SETTINGS;
  }
}

/**
 * Fetches all session outcomes/results for a specific evaluation
 * @param handle - The root directory handle
 * @param groupName - The group name containing the evaluation
 * @param individualName - The individual name containing the evaluation
 * @param evaluationName - The evaluation name to fetch outcomes for
 * @returns Promise resolving to array of session results sorted by date (newest first)
 */
export async function fetchSessionOutcomes(
  handle: FileSystemDirectoryHandle,
  groupName: string,
  individualName: string,
  evaluationName: string,
): Promise<ModifiedSessionResult[]> {
  try {
    const group_folder = await handle.getDirectoryHandle(CleanUpString(groupName));
    const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(individualName));
    const evaluations = await individual_folder.getDirectoryHandle(CleanUpString(evaluationName));

    const files: FileSystemFileHandle[] = [];

    for await (const [name, entry] of evaluations.entries()) {
      if (name === '.DS_Store') continue;

      if (entry.kind === 'file' && name.endsWith('.json')) {
        // Skip the settings file
        if (name === 'settings.json') continue;
        files.push(entry);
      } else if (entry.kind === 'directory') {
        const condition_folder = await evaluations.getDirectoryHandle(name);

        for await (const [conditionName, condition_entry] of condition_folder.entries()) {
          if (condition_entry.kind === 'file' && conditionName.endsWith('.json')) {
            files.push(condition_entry);
          }
        }
      }
    }

    const session_results: ModifiedSessionResult[] = [];

    for (const file of files) {
      try {
        const file_data = await file.getFile();
        const file_text = await file_data.text();

        const session_result: ModifiedSessionResult = {
          ...(JSON.parse(file_text) as SavedSessionResult),
          Filename: file.name,
        };

        if (session_result) {
          session_results.push(session_result);
        }
      } catch (error) {
        console.error(`Error parsing session outcome file ${file.name}:`, error);
      }
    }

    return session_results.sort(
      (a, b) => new Date(b.SessionSettings.Session).valueOf() - new Date(a.SessionSettings.Session).valueOf(),
    );
  } catch (error) {
    console.error('Error fetching session outcomes:', error);
    return [];
  }
}
