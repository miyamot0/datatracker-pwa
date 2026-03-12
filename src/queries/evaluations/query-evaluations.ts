import { CleanUpString } from '@/lib/strings';

export const evaluationQueryOptions = (Handle: FileSystemDirectoryHandle, Group: string, Individual: string) => ({
  queryKey: ['/', Group, Individual],
  queryFn: () => fetchEvaluations({ Handle, Group, Individual }),
});

export const fetchEvaluations = async ({
  Handle,
  Group,
  Individual,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
}) => {
  const temp_evaluations = [] as string[];

  try {
    const group_folder = await Handle.getDirectoryHandle(CleanUpString(Group));
    const individual_folder = await group_folder.getDirectoryHandle(CleanUpString(Individual));
    const entries = await individual_folder.values();

    for await (const entry of entries) {
      if (entry.name === '.DS_Store') continue;

      if (entry.kind === 'directory') temp_evaluations.push(entry.name);
    }

    return temp_evaluations;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
