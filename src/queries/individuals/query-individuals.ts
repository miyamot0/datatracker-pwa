import { CleanUpString } from '@/lib/strings';

export const clientQueryOptions = (Handle: FileSystemDirectoryHandle, Group: string) => ({
  queryKey: ['/', Group],
  queryFn: () => fetchIndividuals({ Handle, Group }),
});

const fetchIndividuals = async ({ Handle, Group }: { Handle: FileSystemDirectoryHandle; Group: string }) => {
  const temp_individuals = [] as string[];

  try {
    const files = await Handle.getDirectoryHandle(CleanUpString(Group));
    const entries = await files.values();

    for await (const entry of entries) {
      if (entry.name === '.DS_Store') continue;

      temp_individuals.push(entry.name);
    }

    return temp_individuals;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
