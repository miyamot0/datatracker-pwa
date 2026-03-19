import { KeySet } from '@/types/keyset';
import { importExistingKeysets } from './helpers/import-keysets';
import { keyboardsAllQueryOptions } from './query-keyboards-all';
import { queryClient } from '@/App';

/**
 * Mutates the list of keyboards by importing new keysets and filtering out existing ones for a specific individual and group.
 *
 * @param Handle - The file system directory handle for accessing the storage.
 * @param Group - The group identifier for which the keyboards are being mutated.
 * @param Individual - The individual identifier for which the keyboards are being mutated.
 * @param KeySets - An array of KeySet objects that are to be imported and considered for mutation.
 * @returns A filtered array of KeySet objects that do not already exist for the specified individual and group, after importing new keysets.
 */
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
  const keysets = await queryClient.fetchQuery(keyboardsAllQueryOptions(Handle, Group, Individual));

  const newKeySets = await importExistingKeysets(Handle, Group, Individual, KeySets);
  const client_keyboards_by_name = newKeySets.map((keyboard) => keyboard.Name);

  return keysets.filter(
    (keyboard) => keyboard.Individual !== Individual && !client_keyboards_by_name.includes(keyboard.Name),
  );
};
