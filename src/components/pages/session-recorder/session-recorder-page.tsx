import { CleanUpString } from '@/lib/strings';
import createHref from '@/lib/links';
import { FolderHandleContextType } from '@/context/folder-context';
import { redirect, useLoaderData } from 'react-router-dom';
import SessionRecorderInterface from './views/session-recorder-interface';
import { fetchConditions } from '@/queries/conditions/query-conditions';
import { useQuery } from '@tanstack/react-query';
import { fetchKeyboards } from '@/queries/keysets/query-keyboards';
import { fetchSessionParams } from '@/queries/session/query-session-params';

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Handle: FileSystemDirectoryHandle;
  Context: FolderHandleContextType;
  KeySet: string;
};

// eslint-disable-next-line react-refresh/only-export-components
export const sessionRecorderPageLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ params }: any) => {
    const { Group, Individual, Evaluation, KeySet } = params;

    if (!Group || !Individual || !Evaluation || !handle || !KeySet) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    return {
      Group: CleanUpString(Group),
      Individual: CleanUpString(Individual),
      Evaluation: CleanUpString(Evaluation),
      Handle: handle,
      Context: ctx,
      KeySet,
    } satisfies LoaderResult;
  };
};

export default function SessionRecorderPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, Handle, KeySet, Context } = loaderResult;

  const {
    data: dataCondition,
    isLoading: loadingCondition,
    error: errorCondition,
  } = useQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'conditions'],
    queryFn: () => fetchConditions(Context, Group, Individual, Evaluation),
    subscribed: false,
  });

  const {
    data: dataKeySets,
    isLoading: loadingKeySets,
    error: errorKeySets,
  } = useQuery({
    queryKey: ['/', Group, Individual, 'keyboards'],
    queryFn: () => fetchKeyboards({ Context, Group, Individual }),
    subscribed: false,
  });

  const {
    data: dataSessionParams,
    isLoading: loadingSessionParams,
    error: errorSessionParams,
  } = useQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'settings'],
    queryFn: () => fetchSessionParams({ Context, Group, Individual, Evaluation }),
    subscribed: false,
  });

  if (loadingCondition || loadingKeySets || loadingSessionParams) {
    return <div>Loading...</div>;
  }

  if (errorCondition || errorKeySets || errorSessionParams || !dataCondition || !dataKeySets || !dataSessionParams) {
    return <div>Error</div>;
  }

  const keySetObj = dataKeySets.find((k) => k.Name == KeySet);

  if (!keySetObj) {
    return <div>Error</div>;
  }

  return (
    <SessionRecorderInterface
      Context={Context}
      Handle={Handle}
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      Settings={dataSessionParams}
      Keyset={keySetObj}
    />
  );
}
