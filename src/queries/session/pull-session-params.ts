import { FolderHandleContextType } from '@/context/folder-context';
import { fetchKeyboards } from '../keysets/query-keyboards';
import { queryClient } from '@/context/query-client';

export const pullSessionParams = async ({
  Context,
  Group,
  Individual,
  Evaluation,
}: {
  Context: FolderHandleContextType;
  Group: string;
  Individual: string;
  Evaluation: string;
}) => {
  const { handle } = Context;

  const individualKeysets = await queryClient.fetchQuery({
    queryKey: ['/', Group, Individual, 'keyboards'],
    queryFn: () => fetchKeyboards({ Context, Group, Individual }),
  });

  //const temp_individuals = [] as string[];

  /*

  try {
    const files = await handle!.getDirectoryHandle(CleanUpString(Group));
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

  */
};
