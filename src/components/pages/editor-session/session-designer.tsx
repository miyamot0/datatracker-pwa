import { CleanUpString } from '@/lib/strings';
import { FolderHandleContextType } from '@/context/folder-context';
import { redirect, useLoaderData } from 'react-router-dom';
import createHref from '@/lib/links';
import SessionDesignerForm from './views/session-designer-form';
import { useQuery } from '@tanstack/react-query';
import { fetchConditions } from '@/queries/conditions/query-conditions';
import { fetchKeyboards } from '@/queries/keysets/query-keyboards';
import { fetchSessionParams } from '@/queries/session/query-session-params';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { ErrorDisplay } from '@/components/suspense/error-display';

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Handle: FileSystemDirectoryHandle;
  Context: FolderHandleContextType;
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

    return {
      Group: CleanUpString(Group),
      Individual: CleanUpString(Individual),
      Evaluation: CleanUpString(Evaluation),
      Handle: handle,
      Context: ctx,
    } satisfies LoaderResult;
  };
};

export function SessionDesignerPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, Context, Handle } = loaderResult;

  const {
    data: dataCondition,
    isLoading: loadingCondition,
    error: errorCondition,
  } = useQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'conditions'],
    queryFn: () => fetchConditions(Context, Group, Individual, Evaluation),
  });

  const {
    data: dataKeySets,
    isLoading: loadingKeySets,
    error: errorKeySets,
  } = useQuery({
    queryKey: ['/', Group, Individual, 'keyboards'],
    queryFn: () => fetchKeyboards({ Context, Group, Individual }),
  });

  const {
    data: dataSessionParams,
    isLoading: loadingSessionParams,
    error: errorSessionParams,
  } = useQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'settings'],
    queryFn: () => fetchSessionParams({ Context, Group, Individual, Evaluation }),
  });

  if (loadingCondition || loadingKeySets || loadingSessionParams) return <LoadingDisplay />;

  if (errorCondition || errorKeySets || errorSessionParams || !dataCondition || !dataKeySets || !dataSessionParams)
    return <ErrorDisplay Text={'An error occurred while fetching session outcomes.'} />;

  return (
    <SessionDesignerForm
      Handle={Handle}
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      Conditions={dataCondition}
      Keysets={dataKeySets}
      Context={Context}
      SessionSettings={dataSessionParams}
    />
  );
}
