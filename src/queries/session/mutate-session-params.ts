import { FolderHandleContextType } from '@/context/folder-context';
import { CleanUpString } from '@/lib/strings';
import { queryClient } from '@/context/query-client';
import { fetchSessionParams } from './query-session-params';
import { SavedSettings } from '@/lib/dtos';

export const mutationSettingsParams = async ({
  Group,
  Individual,
  Evaluation,
  Settings,
  Context,
}: {
  Group: string;
  Individual: string;
  Evaluation: string;
  Settings: SavedSettings;
  Context: FolderHandleContextType;
}): Promise<SavedSettings> => {
  const savedSettings: SavedSettings = await queryClient.fetchQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'settings'],
    queryFn: () => fetchSessionParams({ Context, Group, Individual, Evaluation }),
  });

  if (!savedSettings) {
    throw new Error('Settings not found');
  }

  const group_dir = await Context.handle!.getDirectoryHandle(CleanUpString(Group));
  const individual_dir = await group_dir.getDirectoryHandle(Individual);
  const evaluation_dir = await individual_dir.getDirectoryHandle(Evaluation);

  const settings_file = await evaluation_dir.getFileHandle('settings.json', {
    create: true,
  });

  const writer = await settings_file.createWritable();
  await writer.write(JSON.stringify(Settings));
  await writer.close();

  return Settings;
};
