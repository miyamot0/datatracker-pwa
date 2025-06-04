import { CleanUpString } from '@/lib/strings';
import { useState } from 'react';
import { GetSettingsFileFromEvaluationFolder, pullSessionDesignerParametersFixed } from '@/lib/files';
import { SavedSettings } from '@/lib/dtos';
import { KeySet } from '@/types/keyset';
import { FolderHandleContextType } from '@/context/folder-context';
import { redirect, useLoaderData } from 'react-router-dom';
import createHref from '@/lib/links';
import { GetHandleEvaluationFolder } from '@/lib/files';
import SessionDesignerForm from './views/session-designer-form';

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Handle: FileSystemDirectoryHandle;
  Context: FolderHandleContextType;
  Keysets: KeySet[];
  KeysetFilenames: string[];
  Conditions: string[];
  SessionSettings: SavedSettings;
};

// eslint-disable-next-line react-refresh/only-export-components
export const sessionDesignerPageLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ params }: any) => {
    const { Group, Individual, Evaluation } = params;

    if (!Group || !Individual || !Evaluation || !handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    const { Keysets, KeysetFilenames, Conditions } = await pullSessionDesignerParametersFixed(
      handle,
      Group,
      Individual,
      Evaluation
    );

    const files = await GetHandleEvaluationFolder(
      handle,
      CleanUpString(Group),
      CleanUpString(Individual),
      CleanUpString(Evaluation)
    );

    if (!files) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    const sessionSettings = await GetSettingsFileFromEvaluationFolder(files);

    return {
      Group: CleanUpString(Group),
      Individual: CleanUpString(Individual),
      Evaluation: CleanUpString(Evaluation),
      Keysets,
      KeysetFilenames,
      Conditions,
      Handle: handle,
      Context: ctx,
      SessionSettings: sessionSettings,
    } satisfies LoaderResult;
  };
};

export function SessionDesignerPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, Keysets, KeysetFilenames, Conditions, Context, Handle, SessionSettings } =
    loaderResult;

  const [conditions, setConditions] = useState<string[]>(Conditions);

  return (
    <SessionDesignerForm
      Handle={Handle}
      Group={Group}
      Individual={CleanUpString(Individual)}
      Evaluation={CleanUpString(Evaluation)}
      Conditions={conditions}
      Keysets={Keysets}
      KeysetFilenames={KeysetFilenames.map((keyset) => keyset.replace('.json', ''))}
      SetConditions={setConditions}
      Context={Context}
      SessionSettings={SessionSettings}
    />
  );
}
