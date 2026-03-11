import PageWrapper from '@/components/layout/page-wrapper';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { FolderHandleContextType } from '@/context/folder-context';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { redirect, useLoaderData } from 'react-router-dom';
import ReliabilityBlank from './alternates/reli-blank';
import { fetchSessionOutcomes } from '@/queries/outcomes/query-session-outcomes';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { useQuery } from '@tanstack/react-query';
import ReliabilityViewerContent from './reli-viewer-content';

type LoaderResult = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Context: FolderHandleContextType;
};

// eslint-disable-next-line react-refresh/only-export-components
export const reliViewerLoader = (ctx: FolderHandleContextType) => {
  const { handle } = ctx;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async ({ params }: any) => {
    const { Group, Individual, Evaluation } = params;

    if (!Group || !Individual || !Evaluation || !handle) {
      const response = redirect(createHref({ type: 'Dashboard' }));
      throw response;
    }

    return {
      Group: CleanUpString(Group!),
      Individual: CleanUpString(Individual!),
      Evaluation: CleanUpString(Evaluation!),
      Context: ctx,
    } satisfies LoaderResult;
  };
};

export default function ReliabilityViewerPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { Group, Individual, Evaluation, Context } = loaderResult;

  const { data, isLoading, error } = useQuery({
    queryKey: ['/', Group, Individual, Evaluation, 'outcomes'],
    queryFn: () => fetchSessionOutcomes({ Context, Group, Individual, Evaluation }),
  });

  if (isLoading) return <LoadingDisplay />;

  if (error || !data) return <ErrorDisplay Text={error?.message} />;

  if (data.length < 1) {
    return (
      <ReliabilityBlank
        Group={CleanUpString(Group!)}
        Individual={CleanUpString(Individual!)}
        Evaluation={CleanUpString(Evaluation!)}
      />
    );
  }

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={`Reliability for ${CleanUpString(Evaluation)}`}
      className="select-none"
    >
      <ReliabilityViewerContent Group={Group} Individual={Individual} Results={data} />
    </PageWrapper>
  );
}
