import { FolderHandleContextType } from '@/context/folder-context';
import { CleanUpString } from '@/lib/strings';
import { queryClient } from '@/context/query-client';
import { fetchKeyboards } from './query-keyboards';
import { createNewKeySet, serializeKeySet } from '@/lib/keyset';
import { v4 as uuidv4 } from 'uuid';
import { KeySet } from '@/types/keyset';

export const mutationKeyboards = async ({
  Group,
  Individual,
  Keysets,
  Rename,
  NewKeySet,
  Context,
  Action,
}: {
  Group: string;
  Individual: string;
  Keysets: string[];
  Rename?: string;
  NewKeySet?: KeySet;
  Context: FolderHandleContextType;
  Action: 'Add' | 'Delete' | 'Duplicate' | 'Rename' | 'Update';
}): Promise<KeySet[]> => {
  const keysets = await queryClient.fetchQuery({
    queryKey: ['/', Group, Individual, 'keyboards'],
    queryFn: () => fetchKeyboards({ Context, Group, Individual }),
  });

  if (!keysets) {
    throw new Error('Keysets not found');
  }

  let newKeysetsList = keysets;

  const group_dir = await Context.handle!.getDirectoryHandle(CleanUpString(Group));
  const individual_dir = await group_dir.getDirectoryHandle(Individual);

  switch (Action) {
    case 'Add':
      {
        const key_set = createNewKeySet(Keysets[0]);

        const key_board = await individual_dir.getFileHandle(`${Keysets[0]}.json`, { create: true });

        const writer = await key_board.createWritable();
        await writer.write(serializeKeySet(key_set));
        await writer.close();

        newKeysetsList.push(key_set);
      }
      break;
    case 'Delete':
      for (let i = 0; i < Keysets.length; i++) {
        const individualKeySet = Keysets[i];

        try {
          const fileHandle = await individual_dir.getFileHandle(`${individualKeySet}.json`);
          await individual_dir.removeEntry(fileHandle.name);
        } catch {
          throw new Error(`Failed to remove keyboard: ${individualKeySet}.json`);
        }

        newKeysetsList = newKeysetsList.filter((e) => e.Name != individualKeySet);
      }

      break;
    case 'Duplicate': {
      const keySetMatch = keysets.find((ks) => ks.Name === Keysets[0].trim());

      if (!keySetMatch) {
        throw new Error('No matching KeySet found.');
      }

      if (!Rename) {
        throw new Error('No Rename text supplied.');
      }

      const key_set = {
        ...keySetMatch,
        Name: Rename,
        id: uuidv4(),
        createdAt: new Date(),
        lastModified: new Date(),
      };

      const key_board = await individual_dir.getFileHandle(`${Rename}.json`, { create: true });

      const writer = await key_board.createWritable();
      await writer.write(serializeKeySet(key_set));
      await writer.close();

      newKeysetsList.push(key_set);

      break;
    }
    case 'Update': {
      if (!NewKeySet) {
        throw new Error('Keysets not supplied');
      }

      const key_board = await individual_dir.getFileHandle(`${NewKeySet.Name}.json`);

      const writer = await key_board.createWritable();
      await writer.write(serializeKeySet(NewKeySet));
      await writer.close();

      newKeysetsList = newKeysetsList.map((k) => {
        if (k.Name == NewKeySet.Name) {
          return NewKeySet;
        }

        return k;
      });

      break;
    }

    case 'Rename': {
      /*
      if (!Rename) throw new Error('Rename is required for renaming');

      await copyDirectory(individual_dir, Evaluations, Rename);

      // Delete prior name
      await individual_dir.removeEntry(Evaluations[0], { recursive: true });

      // Rename entry
      newEvaluationsList = newEvaluationsList.map((e) => (e === Evaluations[0] ? Rename : e));
      */

      break;
    }
  }

  return newKeysetsList;
};
