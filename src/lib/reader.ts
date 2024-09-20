import { SavedSessionResult } from './dtos';
import { deserializeKeySet } from './keyset';

export async function readSavedSessionResult(file: FileSystemFileHandle) {
  try {
    const file_data = await file.getFile();
    const file_text = await file_data.text();

    const session_result = JSON.parse(file_text) as SavedSessionResult;

    return session_result ? session_result : undefined;
  } catch (_) {
    return undefined;
  }
}

export async function readKeyboardParameters(handle: FileSystemFileHandle | FileSystemDirectoryHandle) {
  if (handle.kind === 'file' && handle.name.endsWith('.json')) {
    const keyset = await handle.getFile();
    const keyset_text = await keyset.text();

    if (keyset_text.length === 0) return undefined;

    const keyset_json = deserializeKeySet(keyset_text);

    if (keyset_json) return keyset_json;
  }
}

export async function readSessionParameters(handle: FileSystemFileHandle | FileSystemDirectoryHandle) {
  if (handle.kind === 'file' && handle.name.endsWith('.json')) {
    const keyset = await handle.getFile();
    const keyset_text = await keyset.text();

    if (keyset_text.length === 0) return undefined;

    const keyset_json = deserializeKeySet(keyset_text);

    if (keyset_json) {
      return keyset_json;
    }
  }
}
