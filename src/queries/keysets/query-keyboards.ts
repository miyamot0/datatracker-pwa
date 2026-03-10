import { FolderHandleContextType } from '@/context/folder-context';
import { deserializeKeySet } from '@/lib/keyset';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';

export const fetchKeyboards = async ({
  Context,
  Group,
  Individual,
}: {
  Context: FolderHandleContextType;
  Group: string;
  Individual: string;
}) => {
  const { handle } = Context;

  const keysets: KeySet[] = [];

  try {
    const individuals_folder = await handle!.getDirectoryHandle(CleanUpString(Group), { create: true });
    const keyboards_folder = await individuals_folder.getDirectoryHandle(CleanUpString(Individual), { create: true });

    for await (const entry of keyboards_folder.values()) {
      if (entry.name === '.DS_Store') continue;

      if (entry.kind === 'file' && entry.name.endsWith('.json')) {
        const keyset = await entry.getFile();
        const keyset_text = await keyset.text();

        if (keyset_text.length === 0) continue;

        const keyset_json = deserializeKeySet(keyset_text);

        if (keyset_json) {
          keysets.push(keyset_json);
        }
      }
    }

    return keysets;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return [];
  }
};
