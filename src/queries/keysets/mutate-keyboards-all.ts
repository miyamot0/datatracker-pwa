import { KeySet } from '@/types/keyset';
import { importExistingKeysets } from './helpers/import-keysets';
import { fetchKeyboardsAll } from './query-keyboards-all';
import { queryClient } from '@/App';

export const mutateKeyboardsAll = async ({
  Handle,
  Group,
  Individual,
  KeySets,
}: {
  Handle: FileSystemDirectoryHandle;
  Group: string;
  Individual: string;
  KeySets: KeySet[];
}) => {
  const keysets = await queryClient.fetchQuery({
    queryKey: ['/', Group, 'metaKeyboards'],
    queryFn: () => fetchKeyboardsAll({ Handle, Group, Individual }),
  });

  const newKeySets = await importExistingKeysets(Handle, Group, Individual, KeySets);
  const client_keyboards_by_name = newKeySets.map((keyboard) => keyboard.Name);

  return keysets.filter(
    (keyboard) => keyboard.Individual !== Individual && !client_keyboards_by_name.includes(keyboard.Name),
  );
};
