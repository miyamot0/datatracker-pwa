import PageWrapper from '@/components/elements/page-wrapper';
import ReliabilityViewerPage from '@/components/pages/summary-agreement/reli-viewer-page';
import ReliabilityBlank from '@/components/pages/summary-agreement/views/reli-blank';
import { LoadingDisplay } from '@/components/elements/suspense/loading-display';
import {
  BuildEvaluationsBreadcrumb,
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { filterSessionsByPrimaryRole, filterSessionsByReliabilityRole } from '@/lib/graphing/session-filters';
import { pullMostRecentKeySet } from '@/lib/keyset';
import { getCorrespondingSessionPairs } from '@/lib/reli';
import { CleanUpString } from '@/lib/strings';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { ModifiedSessionResult } from '@/types/storage';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/reli')({
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
      fetchSessionOutcomes,
      Settings,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, fetchSessionOutcomes } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={`Reliability for ${Evaluation}`}
      className="select-none"
    >
      <Await promise={fetchSessionOutcomes} fallback={<LoadingDisplay />}>
        {(sessions: ModifiedSessionResult[]) => {
          const KeySet = pullMostRecentKeySet(sessions);
          const resultsPrimary = filterSessionsByPrimaryRole(sessions);
          const resultsReli = filterSessionsByReliabilityRole(sessions);
          const pairedSessionData = getCorrespondingSessionPairs(resultsPrimary, resultsReli);

          // If there are no sessions, show the blank state
          if (pairedSessionData.length < 1) {
            return <ReliabilityBlank />;
          }

          return (
            <ReliabilityViewerPage
              Group={Group}
              Individual={Individual}
              PairedSession={pairedSessionData}
              Keyset={KeySet}
            />
          );
        }}
      </Await>
    </PageWrapper>
  );
}
