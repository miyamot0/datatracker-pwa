import { deserializeKeySet } from './keyset';

/**
 * This function reads keyboard parameters from a given file handle. It checks if the handle is a file and has a .json extension, then it reads the file content, deserializes it into a keyset object, and returns it. If the file is empty or the handle is not valid, it returns undefined.
 *
 * @param handle A FileSystemFileHandle or FileSystemDirectoryHandle to read from
 * @returns deserialized keyset object or undefined
 */
export async function readKeyboardParameters(handle: FileSystemFileHandle | FileSystemDirectoryHandle) {
  if (handle.kind === 'file' && handle.name.endsWith('.json')) {
    const keyset = await handle.getFile();
    const keyset_text = await keyset.text();

    if (keyset_text.length === 0) return undefined;

    const keyset_json = deserializeKeySet(keyset_text);

    if (keyset_json) return keyset_json;
  }
}
