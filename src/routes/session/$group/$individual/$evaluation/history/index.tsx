import PageWrapper from '@/components/elements/page-wrapper';
import DashboardHistoryPage from '@/components/pages/dashboard-outcomes/dashboard-history-page';
import { LoadingDisplay } from '@/components/elements/suspense/loading-display';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { CleanUpString } from '@/lib/strings';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { ModifiedSessionResult } from '@/types/storage';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/history/')({
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

    const { group, individual, evaluation } = params;

    if (!group || !individual || !evaluation) {
      throw redirect({
        to: '/dashboard',
      });
    }

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      Evaluation: CleanUpString(evaluation),
      CleanHandle: context.folderHandleContext.handle,
      Settings: context.folderHandleContext.settings,
    };
  },
  loader: ({ context }) => {
    const { Group, Individual, Evaluation, CleanHandle, Settings } = context;

    const fetchSessionOutcomes = context.queryClient.fetchQuery(
      sessionOutcomesQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    return {
      Group,
      Individual,
      Evaluation,
      Settings,
      CleanHandle,
      fetchSessionOutcomes,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, Settings, CleanHandle, fetchSessionOutcomes } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={'Session History'}
      className="select-none"
      Settings={Settings}
    >
      <Await promise={fetchSessionOutcomes} fallback={<LoadingDisplay />}>
        {(sessions: ModifiedSessionResult[]) => {
          return (
            <DashboardHistoryPage
              Group={Group}
              Individual={Individual}
              Evaluation={Evaluation}
              Settings={Settings}
              Handle={CleanHandle}
              Sessions={sessions}
            />
          );
        }}
      </Await>
    </PageWrapper>
  );
}
