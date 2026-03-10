import { FolderHandleContextType } from '@/context/folder-context';
import { KeySet } from '@/types/keyset';
import { importExistingKeysets } from './helpers/import-keysets';
import { queryClient } from '@/context/query-client';
import { fetchKeyboardsAll } from './query-keyboards-all';

export const mutateKeyboardsAll = async ({
  Context,
  Group,
  Individual,
  KeySets,
}: {
  Context: FolderHandleContextType;
  Group: string;
  Individual: string;
  KeySets: KeySet[];
}) => {
  const { handle } = Context;

  const keysets = await queryClient.fetchQuery({
    queryKey: ['/', Group, 'metaKeyboards'],
    queryFn: () => fetchKeyboardsAll({ Context, Group, Individual }),
  });

  const newKeySets = await importExistingKeysets(handle!, Group, Individual, KeySets);
  const client_keyboards_by_name = newKeySets.map((keyboard) => keyboard.Name);

  return keysets.filter(
    (keyboard) => keyboard.Individual !== Individual && !client_keyboards_by_name.includes(keyboard.Name),
  );
};
