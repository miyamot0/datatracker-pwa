import { SavedSettings } from './dtos';
import { CleanUpString } from './strings';
import { GetHandleEvaluationFolder } from './files';

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
  Settings: SavedSettings,
) {
  const files = await GetHandleEvaluationFolder(
    Handle,
    CleanUpString(Group),
    CleanUpString(Individual),
    CleanUpString(Evaluation),
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
