import { CleanUpString } from '@/lib/strings';
import { fetchSessionParams } from './query-session-params';
import { SavedSettings } from '@/lib/dtos';
import { queryClient } from '@/App';

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
  const savedSettings: SavedSettings = await queryClient.fetchQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'settings'],
    queryFn: () => fetchSessionParams({ Handle, Group, Individual, Evaluation }),
  });

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
