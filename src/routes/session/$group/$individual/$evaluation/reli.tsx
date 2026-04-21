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
import { pullMostRecentSession } from '@/lib/keyset';
import { getCorrespondingSessionPairs } from '@/lib/reli';
import { CleanUpString } from '@/lib/strings';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { ModifiedSessionResult } from '@/types/storage';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import { KeySet } from '@/types/keyset';
import { ErrorDisplay } from '@/components/elements/suspense/error-display';
import { extractAndDeduplicateKeysets } from '@/lib/graphing';

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
    const fetchKeyboards = context.queryClient.fetchQuery(keyboardQueryOptions(CleanHandle, Group, Individual));

    const totalQuery = Promise.all([fetchSessionOutcomes, fetchKeyboards]);

    return {
      Group,
      Individual,
      Evaluation,
      totalQuery,
      Settings,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, totalQuery } = Route.useLoaderData();

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
      <Await promise={totalQuery} fallback={<LoadingDisplay />}>
        {([sessions, keyboards]: [ModifiedSessionResult[], KeySet[]]) => {
          const resultsPrimary = filterSessionsByPrimaryRole(sessions);
          const resultsReli = filterSessionsByReliabilityRole(sessions);
          const pairedSessionData = getCorrespondingSessionPairs(resultsPrimary, resultsReli);

          // If there are no sessions, show the blank state
          if (pairedSessionData.length < 1) {
            return <ReliabilityBlank />;
          }

          const resultsFiltered = filterSessionsByPrimaryRole(sessions);
          const recentKeysetName = pullMostRecentSession(resultsFiltered);

          const designerKeySet = keyboards.find((k: KeySet) => k.Name == recentKeysetName.SessionSettings.KeySet);
          const sessionKeySet = recentKeysetName.Keyset;

          if (!sessionKeySet) {
            return <ErrorDisplay Text={'KeySet not found.'} />;
          }

          const {
            frequencyKeys: targetedFKeys,
            durationKeys: targetedDKeys,
            derivedKeys: targetedDerivedKeys,
            specialDurationKeys,
            scorableDurationKeys,
          } = extractAndDeduplicateKeysets(sessions, {
            ...sessionKeySet,
            FrequencyKeys: [...sessionKeySet.FrequencyKeys, ...(designerKeySet?.FrequencyKeys || [])],
            DurationKeys: [...sessionKeySet.DurationKeys, ...(designerKeySet?.DurationKeys || [])],
            DerivedKeys: [...(sessionKeySet.DerivedKeys || []), ...(designerKeySet?.DerivedKeys || [])],
            SpecialDurationKeys: [
              ...(sessionKeySet.SpecialDurationKeys || []),
              ...(designerKeySet?.SpecialDurationKeys || []),
            ],
            ScorableDurationKeys: [
              ...(sessionKeySet.ScorableDurationKeys || []),
              ...(designerKeySet?.ScorableDurationKeys || []),
            ],
          });

          const dynamicKeyset = {
            ...sessionKeySet,
            FrequencyKeys: targetedFKeys,
            DurationKeys: targetedDKeys,
            DerivedKeys: targetedDerivedKeys,
            SpecialDurationKeys: specialDurationKeys,
            ScorableDurationKeys: scorableDurationKeys,
          } satisfies KeySet;

          return (
            <ReliabilityViewerPage
              Group={Group}
              Individual={Individual}
              PairedSession={pairedSessionData}
              Keyset={dynamicKeyset}
            />
          );
        }}
      </Await>
    </PageWrapper>
  );
}
