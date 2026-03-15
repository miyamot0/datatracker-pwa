import { DEFAULT_SESSION_SETTINGS, SavedSettings } from '@/lib/dtos';
import { CleanUpString } from '@/lib/strings';

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
export const fetchSessionParams = async ({
  Handle,
  Group,
  Individual,
  Evaluation,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  Evaluation: string;
}): Promise<SavedSettings> => {
  const group_folder = await Handle.getDirectoryHandle(CleanUpString(Group));
  const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(Individual));
  const evaluations = await individual_folder.getDirectoryHandle(CleanUpString(Evaluation));

  try {
    const settings_file = await evaluations.getFileHandle('settings.json');
    const settings = await settings_file.getFile();
    const settings_text = await settings.text();
    const settings_json = JSON.parse(settings_text) as SavedSettings;

    if (!settings_json) throw new Error('Settings file not well-formed');

    return settings_json;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    evaluations.getFileHandle('settings.json', { create: true }).then((file) => {
      file.createWritable().then((writer) => {
        writer.write(JSON.stringify(DEFAULT_SESSION_SETTINGS));
        writer.close();
      });
    });

    return DEFAULT_SESSION_SETTINGS;
  }
};
