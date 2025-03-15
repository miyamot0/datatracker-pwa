import { CleanUpString } from './strings';
import { DEFAULT_SESSION_SETTINGS, SavedSessionResult, SavedSettings } from './dtos';
import { Dispatch, SetStateAction } from 'react';
import { toast } from 'sonner';
import { KeySet } from '@/types/keyset';
import { KeyManageType } from '@/components/pages/session-recorder/types/session-recorder-types';
import { deserializeKeySet } from './keyset';

// --- Handles ---

/**
 * Get the handle for the evaluation folder
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @param Evaluation The evaluation name
 * @returns The handle to the evaluation folder
 */
export const GetHandleEvaluationFolder = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string
) => {
  const individuals = await Handle.getDirectoryHandle(CleanUpString(Group), {
    create: true,
  });
  const evaluations = await individuals.getDirectoryHandle(CleanUpString(Individual), { create: true });
  const files = await evaluations.getDirectoryHandle(CleanUpString(Evaluation), { create: true });

  return files;
};

/**
 * Get the handle for the keyboards folder
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @returns The handle to the keyboards folder
 */
export const GetHandleKeyboardsFolder = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string
) => {
  const individuals_folder = await Handle.getDirectoryHandle(CleanUpString(Group), { create: true });
  const keyboards_folder = await individuals_folder.getDirectoryHandle(CleanUpString(Individual), { create: true });

  return keyboards_folder;
};

// --- File Retrieval ---

/**
 * Get the settings file from the evaluation folder
 *
 * @param files The handle to the evaluation folder
 * @returns The settings file
 */
export const GetSettingsFileFromEvaluationFolder = async (files: FileSystemDirectoryHandle) => {
  try {
    const settings_file = await files.getFileHandle('settings.json');
    const settings = await settings_file.getFile();
    const settings_text = await settings.text();
    const settings_json = JSON.parse(settings_text) as SavedSettings;

    if (!settings_json) throw new Error('Settings file not well-formed');

    return settings_json;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    files.getFileHandle('settings.json', { create: true }).then((file) => {
      file.createWritable().then((writer) => {
        writer.write(JSON.stringify(DEFAULT_SESSION_SETTINGS));
        writer.close();
      });
    });

    return DEFAULT_SESSION_SETTINGS;
  }
};

export const GetResultsFromEvaluationFolder = async (
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string
) => {
  const result = await castSavedFilesToSessionResults(Handle, Group, Individual, Evaluation);

  if (result.length > 0) {
    const time_sorted = result.sort((a, b) => new Date(a.SessionStart).getTime() - new Date(b.SessionStart).getTime());

    return {
      keyset: time_sorted[0].Keyset,
      results: time_sorted,
    };
  } else {
    return {
      keyset: undefined,
      results: [],
    };
  }
};

// --- File Management ---

/**
 * Pull files for the session designer
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @param Evaluation The evaluation name
 * @param SetKeysets The state setter for the keysets
 * @param SetKeysetFilenames The state setter for the keyset filenames
 * @param SetConditions The state setter for the conditions
 */
export async function pullSessionDesignerParameters(
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string,
  SetKeysets: Dispatch<SetStateAction<KeySet[]>>,
  SetKeysetFilenames: Dispatch<SetStateAction<string[]>>,
  SetConditions: Dispatch<SetStateAction<string[]>>
) {
  const perms = await Handle.requestPermission({ mode: 'readwrite' });

  if (perms === 'denied') {
    toast.error('Permission denied to remove group folder.');

    throw new Error('Permission denied to work with data.');
  }

  const keyboard_folder = await GetHandleKeyboardsFolder(Handle, Group, Individual);

  const keyset_time_filenames: string[] = [];
  const keyset_time_files: KeySet[] = [];

  for await (const entry of keyboard_folder.values()) {
    if (entry.name === '.DS_Store') continue;

    if (entry.kind === 'file' && entry.name.endsWith('.json')) {
      const keyset = await entry.getFile();
      const keyset_text = await keyset.text();

      if (keyset_text.length === 0) continue;

      const keyset_json = deserializeKeySet(keyset_text);

      if (keyset_json) {
        keyset_time_filenames.push(entry.name);
        keyset_time_files.push(keyset_json);
      }
    }
  }

  SetKeysets(keyset_time_files);
  SetKeysetFilenames(keyset_time_filenames);

  const evaluations_folder = await GetHandleEvaluationFolder(Handle, Group, Individual, Evaluation);

  const conditions: string[] = [];

  const entries2 = await evaluations_folder.values();
  for await (const entry of entries2) {
    if (entry.kind === 'directory') {
      conditions.push(entry.name);
    }
  }

  SetConditions(conditions);
}

/**
 * Pull session settings file
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @param Keyset The keyset to save
 */
export async function pullSessionSettings(
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string
) {
  const files = await GetHandleEvaluationFolder(
    Handle,
    CleanUpString(Group),
    CleanUpString(Individual),
    CleanUpString(Evaluation)
  );

  if (!files) throw new Error('No files found for this evaluation');

  return await GetSettingsFileFromEvaluationFolder(files);
}

/**
 * Pull outcome files for a given evaluation
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @param Evaluation The evaluation name
 * @param Keyset The keyset to save
 */
export async function pullSessionOutcomesFiles(
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string
) {
  const individuals = await Handle.getDirectoryHandle(CleanUpString(Group), {
    create: true,
  });
  const evaluations = await individuals.getDirectoryHandle(CleanUpString(Individual), { create: true });
  const specific_evaluation = await evaluations.getDirectoryHandle(CleanUpString(Evaluation), { create: true });

  const files: FileSystemFileHandle[] = [];

  for await (const entry of specific_evaluation.values()) {
    if (entry.name === '.DS_Store') continue;

    if (entry.kind === 'file' && entry.name.endsWith('.json')) {
      // Skip if the session outcomes file
      if (entry.name === 'settings.json') continue;

      files.push(entry);
    } else if (entry.kind === 'directory') {
      const condition_folder = await specific_evaluation.getDirectoryHandle(entry.name);

      for await (const condition_entry of condition_folder.values()) {
        if (condition_entry.kind === 'file' && condition_entry.name.endsWith('.json')) {
          files.push(condition_entry);
        }
      }
    }
  }

  return files;
}

/**
 * Save the updated session settings to a file
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @param Evaluation The evaluation name
 * @param Settings The settings to save
 */
export async function saveSessionSettingsToFile(
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string,
  Settings: SavedSettings
) {
  const files = await GetHandleEvaluationFolder(
    Handle,
    CleanUpString(Group),
    CleanUpString(Individual),
    CleanUpString(Evaluation)
  );

  if (!files) throw new Error('No directory found for this evaluation');

  const newer_settings = {
    ...Settings,
    Session: Settings.Session + 1,
  };

  const settings_file = await files.getFileHandle('settings.json', {
    create: true,
  });

  const writer = await settings_file.createWritable();
  await writer.write(JSON.stringify(newer_settings));
  return await writer.close();
}

/**
 * Save the session outcomes to a file
 *
 * @param Handle The handle to the file system
 * @param Settings The settings to save
 * @param KeysPressed The keys pressed during the session
 * @param SystemKeys The system keys pressed during the session
 * @param KeySet The keyset used during the session
 * @param group The group name
 * @param client The client name
 * @param evaluation The evaluation name
 * @param sessionStart The start time of the session
 * @param timerSecondsMain The main timer duration
 * @param timerSecondsOne The first timer duration
 * @param timerSecondsTwo The second timer duration
 * @param timerSecondsThree The third timer duration
 * @param endedEarly Whether the session ended early
 */
export async function saveSessionOutcomesToFile(
  Handle: FileSystemDirectoryHandle,
  Settings: SavedSettings,
  KeysPressed: KeyManageType[],
  SystemKeys: KeyManageType[],
  KeySet: KeySet,
  group: string,
  client: string,
  evaluation: string,
  sessionStart: Date,
  timerSecondsMain: number,
  timerSecondsOne: number,
  timerSecondsTwo: number,
  timerSecondsThree: number,
  endedEarly = false
) {
  const client_evaluations_folder = await GetHandleEvaluationFolder(
    Handle,
    CleanUpString(group),
    CleanUpString(client),
    CleanUpString(evaluation)
  );

  const relevent_condition_folder = await client_evaluations_folder.getDirectoryHandle(
    CleanUpString(Settings.Condition),
    {
      create: true,
    }
  );

  const session_output_file = await relevent_condition_folder.getFileHandle(
    `${Settings.Session}_${Settings.Condition}_${Settings.Role}.json`,
    { create: true }
  );

  const saved_session_data = {
    SessionSettings: Settings,
    FrequencyKeyPresses: KeysPressed.filter((key) => key.KeyType === 'Frequency'),
    DurationKeyPresses: KeysPressed.filter((key) => key.KeyType === 'Duration'),
    SystemKeyPresses: SystemKeys,
    SessionStart: sessionStart.toJSON(),
    Keyset: KeySet,
    SessionEnd: new Date().toJSON(),
    EndedEarly: endedEarly,
    TimerMain: timerSecondsMain,
    TimerOne: timerSecondsOne,
    TimerTwo: timerSecondsTwo,
    TimerThree: timerSecondsThree,
  } satisfies SavedSessionResult;

  const writer = await session_output_file.createWritable();
  await writer.write(JSON.stringify(saved_session_data));

  return await writer.close();
}

/**
 * Save the keyset to a file
 *
 * @param Handle The handle to the file system
 * @param Group The group name
 * @param Individual The individual name
 * @param Keyset The keyset to save
 */
export async function castSavedFilesToSessionResults(
  Handle: FileSystemDirectoryHandle,
  Group: string,
  Individual: string,
  Evaluation: string
) {
  const files = await pullSessionOutcomesFiles(Handle, Group, Individual, Evaluation);

  const session_results: SavedSessionResult[] = [];

  for (const file of files) {
    const file_data = await file.getFile();
    const file_text = await file_data.text();

    const session_result = JSON.parse(file_text) as SavedSessionResult;

    if (session_result) {
      session_results.push(session_result);
    }
  }

  return session_results;
}
