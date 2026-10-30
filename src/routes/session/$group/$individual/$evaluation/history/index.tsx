import PageWrapper from '@/components/elements/page-wrapper';
import DashboardHistoryPage from '@/components/pages/dashboard-outcomes/dashboard-history-page';
import { LoadingDisplay } from '@/components/elements/suspense/loading-display';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { CleanUpString } from '@/lib/strings';
import { conditionQueryOptions } from '@/queries/conditions/query-conditions';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { ModifiedSessionResult } from '@/types/storage';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import { routeGuard } from '@/lib/routing';

import { trackSettlement } from '@/lib/settle-tracking';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/history/')({
  beforeLoad: ({ context, params }) => {
    const guarded = routeGuard({ context });

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
      CleanHandle: guarded.handle,
      Settings: guarded.settings,
    };
  },
  loader: ({ context }) => {
    const { Group, Individual, Evaluation, CleanHandle, Settings } = context;

    const fetchSessionOutcomes = context.queryClient.query(
      sessionOutcomesQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    const fetchConditions = context.queryClient.query(
      conditionQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    const fetchHistory = trackSettlement(Promise.all([fetchSessionOutcomes, fetchConditions]));

    return {
      Group,
      Individual,
      Evaluation,
      Settings,
      CleanHandle,
      fetchHistory,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, Settings, CleanHandle, fetchHistory } = Route.useLoaderData();

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
      <Await promise={fetchHistory} fallback={<LoadingDisplay />}>
        {([sessions, conditions]: [ModifiedSessionResult[], string[]]) => {
          return (
            <DashboardHistoryPage
              Group={Group}
              Individual={Individual}
              Evaluation={Evaluation}
              Settings={Settings}
              Handle={CleanHandle}
              Sessions={sessions}
              Conditions={conditions}
            />
          );
        }}
      </Await>
    </PageWrapper>
  );
}
