import PageWrapper from '@/components/elements/page-wrapper';
import ViewerEvaluationsPage from '@/components/pages/dashboard-evaluations-import/viewer-evaluations-page';
import { LoadingDisplay } from '@/components/elements/suspense/loading-display';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { CleanUpString } from '@/lib/strings';
import { evaluationsAllQueryOptions } from '@/queries/evaluations/query-evaluations-all';
import { EvaluationRecord } from '@/queries/keysets/types/evaluation-record';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/import')({
  beforeLoad: ({ context, params }) => {
    if (!context.folderHandleContext.isInitialized) {
      throw redirect({
        href: '/',
      });
    }

    if (!context.folderHandleContext.handle) {
      throw redirect({
        to: '/dashboard',
      });
    }

    const { group, individual } = params;

    if (!group || !individual) {
      throw redirect({
        to: '/dashboard',
      });
    }

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      CleanHandle: context.folderHandleContext.handle,
    };
  },
  loader: ({ context }) => {
    const { Group, Individual, CleanHandle } = context;

    const fetchAllEvaluation = context.queryClient.fetchQuery(evaluationsAllQueryOptions(CleanHandle));

    return {
      Group: CleanUpString(Group),
      Individual: CleanUpString(Individual),
      Settings: context.folderHandleContext.settings,
      CleanHandle,
      fetchAllEvaluation,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, fetchAllEvaluation, CleanHandle, Settings } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={'Evaluation Import'}
      className="select-none"
      Settings={Settings}
    >
      <Await promise={fetchAllEvaluation} fallback={<LoadingDisplay />}>
        {(evaluations: EvaluationRecord[]) => (
          <ViewerEvaluationsPage
            Group={Group}
            Individual={Individual}
            Handle={CleanHandle}
            Settings={Settings}
            Evaluations={evaluations}
          />
        )}
      </Await>
    </PageWrapper>
  );
}
