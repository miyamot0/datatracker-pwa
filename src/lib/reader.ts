import { deserializeKeySet } from './keyset';

export async function readKeyboardParameters(handle: FileSystemFileHandle | FileSystemDirectoryHandle) {
  if (handle.kind === 'file' && handle.name.endsWith('.json')) {
    const keyset = await handle.getFile();
    const keyset_text = await keyset.text();

    if (keyset_text.length === 0) return undefined;

    const keyset_json = deserializeKeySet(keyset_text);

    if (keyset_json) return keyset_json;
  }
}
