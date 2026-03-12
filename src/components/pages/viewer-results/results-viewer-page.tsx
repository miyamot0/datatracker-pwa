import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { CleanUpString } from '@/lib/strings';
import { FolderHandleContextType } from '@/context/folder-context';
import { redirect, useLoaderData } from 'react-router-dom';
import createHref from '@/lib/links';
import { useQuery } from '@tanstack/react-query';
import { fetchSessionOutcomes } from '@/queries/outcomes/query-session-outcomes';
import ResultsViewerContent from './views/results-viewer-content';
import { PullRelevantSetup } from './helpers/results_setup';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { LoadingDisplay } from '@/components/suspense/loading-display';

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Handle: FileSystemHandle;
  Context: FolderHandleContextType;
};

// eslint-disable-next-line react-refresh/only-export-components
export const resultsViewerLoader = (ctx: FolderHandleContextType) => {
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

export default function ResultsViewerPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, Context } = loaderResult;

  const { data, isLoading, error } = useQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'outcomes'],
    queryFn: () => fetchSessionOutcomes({ Context, Group, Individual, Evaluation }),
  });

  if (isLoading) return <LoadingDisplay />;

  if (error || !data) return <ErrorDisplay Text={error?.message} />;

  const prep = PullRelevantSetup(Group, Individual, Evaluation, data[0].Keyset);

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(CleanUpString(Group), CleanUpString(Individual)),
      ]}
      label={`View ${CleanUpString(CleanUpString(Evaluation))} Data`}
      className="select-none"
    >
      <ResultsViewerContent
        UnfilteredKeysFrequency={prep.UnfilteredKeysFrequency}
        UnfilteredKeysDuration={prep.UnfilteredKeysDuration}
        TimerMapping={prep.TimerMapping}
        ExcludeFromCTB={prep.ExcludeFromCTB}
        Results={data}
        Keyset={data[0].Keyset}
      />
    </PageWrapper>
  );
}
