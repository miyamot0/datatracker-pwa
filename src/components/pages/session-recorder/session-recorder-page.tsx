import { SavedSettings } from '@/lib/dtos';
import { KeySet } from '@/types/keyset';
import { GetSettingsFileFromEvaluationFolder } from '@/lib/files';
import { CleanUpString } from '@/lib/strings';
import createHref from '@/lib/links';
import { FolderHandleContextType } from '@/context/folder-context';
import { redirect, useLoaderData } from 'react-router-dom';
import { deserializeKeySet } from '@/lib/keyset';
import { GetHandleEvaluationFolder, GetHandleKeyboardsFolder } from '@/lib/files';
import SessionRecorderInterface from './views/session-recorder-interface';

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Handle: FileSystemDirectoryHandle;
  Context: FolderHandleContextType;
  SessionSettings: SavedSettings;
  Keyset: KeySet;
};

const PullKeySet = async (Handle: FileSystemDirectoryHandle, Group: string, Individual: string, KeySet: string) => {
  const keyboard_folder = await GetHandleKeyboardsFolder(Handle, Group, Individual);

  return keyboard_folder.getFileHandle(KeySet, { create: true });
};

// eslint-disable-next-line react-refresh/only-export-components
export const sessionRecorderPageLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ params }: any) => {
    const { Group, Individual, Evaluation } = params;

    if (!Group || !Individual || !Evaluation || !handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    const files = await GetHandleEvaluationFolder(
      handle,
      CleanUpString(Group),
      CleanUpString(Individual),
      CleanUpString(Evaluation)
    );

    if (!files) throw new Error('No files found for this evaluation');

    if (!files) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    const SessionSettings = await GetSettingsFileFromEvaluationFolder(files);

    const Keyset = await PullKeySet(handle, Group, Individual, `${SessionSettings.KeySet}.json`).then(async (entry) => {
      const keyset = await entry.getFile();
      const keyset_text = await keyset.text();

      if (keyset_text.length === 0) return;

      const keyset_json = deserializeKeySet(keyset_text);

      return keyset_json;
    });

    if (!Keyset) {
      throw redirect(createHref({ type: 'Dashboard' }));
    }

    return {
      Group: CleanUpString(Group),
      Individual: CleanUpString(Individual),
      Evaluation: CleanUpString(Evaluation),
      Handle: handle,
      Context: ctx,
      SessionSettings,
      Keyset,
    } satisfies LoaderResult;
  };
};

export default function SessionRecorderPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, Handle, SessionSettings, Keyset } = loaderResult;

  return (
    <SessionRecorderInterface
      Handle={Handle}
      Group={CleanUpString(Group!)}
      Individual={CleanUpString(Individual!)}
      Evaluation={CleanUpString(Evaluation!)}
      Settings={SessionSettings}
      Keyset={Keyset}
    />
  );
}
