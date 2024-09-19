import { KeyManageType } from '../components/pages/session-recorder/types/session-recorder-types';
import { SavedSessionResult, SavedSettings } from './dtos';
import { GetHandleEvaluationFolder } from './files';
import { CleanUpString } from './strings';
import { KeySet } from '../types/keyset';

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
 * Generate a saved file name
 *
 * @param Settings The settings to generate the file name from
 */
export function GenerateSavedFileName(Settings: SavedSettings) {
  return `${Settings.Session}_${Settings.Condition}_${Settings.Role}.json`;
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

  const session_output_file = await relevent_condition_folder.getFileHandle(GenerateSavedFileName(Settings), {
    create: true,
  });

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
