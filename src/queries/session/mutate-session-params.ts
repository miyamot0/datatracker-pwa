import { CleanUpString } from '@/lib/strings';
import { sessionQueryOptions } from './query-session-params';
import { SavedSettings } from '@/lib/dtos';
import { queryClient } from '@/App';

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

  const group_dir = await Handle.getDirectoryHandle(CleanUpString(Group));
  const individual_dir = await group_dir.getDirectoryHandle(CleanUpString(Individual));
  const evaluation_dir = await individual_dir.getDirectoryHandle(CleanUpString(Evaluation));

  const settings_file = await evaluation_dir.getFileHandle('settings.json', {
    create: true,
  });

  const writer = await settings_file.createWritable();
  await writer.write(JSON.stringify(Settings));
  await writer.close();

  return Settings;
};
