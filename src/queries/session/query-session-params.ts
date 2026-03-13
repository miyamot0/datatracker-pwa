import { DEFAULT_SESSION_SETTINGS, SavedSettings } from '@/lib/dtos';
import { CleanUpString } from '@/lib/strings';

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
