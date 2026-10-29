import { getLocalCachedPrefs } from '@/lib/local_storage';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset/core';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { extractAndDeduplicateKeysets, mapKeysWithStoragePreference } from '@/lib/graphing/keyset-utils';
import { filterSessionsByPrimaryRole } from '@/lib/graphing/session-filters';
import { createNewKeySet, pullMostRecentSession } from '@/lib/keyset';
import { ToggleDisplayKey } from '@/types/visuals';
import ResultsProportionVisualsPage from '@/components/pages/visualize-outcomes/proportion/results-proportion-visuals-page';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { LoadingDisplay } from '@/components/elements/suspense/loading-display';
import { ModifiedSessionResult } from '@/types/storage';
import { filteredSessionScoringOptions } from '@/types/schedules';
import { conditionQueryOptions } from '@/queries/conditions/query-conditions';

import { trackSettlement } from '@/lib/settle-tracking';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/proportion')({
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
  loader: async ({ context }) => {
    const { Group, Individual, Evaluation, CleanHandle, Settings } = context;

    const fetchKeyboards = context.queryClient.fetchQuery(keyboardQueryOptions(CleanHandle, Group, Individual));

    const fetchSessionOutcomes = context.queryClient.fetchQuery(
      sessionOutcomesQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    const fetchConditions = context.queryClient.fetchQuery(
      conditionQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    const totalQuery = trackSettlement(Promise.all([fetchKeyboards, fetchSessionOutcomes, fetchConditions]));

    return {
      Group,
      Individual,
      Evaluation,
      Handle: CleanHandle,
      Settings,
      totalQuery,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, Handle, Settings, totalQuery } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(CleanUpString(Group), CleanUpString(Individual)),
      ]}
      label={`${CleanUpString(CleanUpString(Evaluation))}: Interval Proportions`}
      className="select-none"
      Settings={Settings}
    >
      <Await promise={totalQuery} fallback={<LoadingDisplay />}>
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (results: any[]) => {
            const keyboards: KeySet[] = results[0];
            const sessionOutcomes: ModifiedSessionResult[] = results[1];
            const conditions: string[] = results[2];

            const resultsFiltered = filterSessionsByPrimaryRole(sessionOutcomes);

            // Note: no sessions, or no attached keyset, falls back to a blank keyset so the charts render empty
            const recentSession = pullMostRecentSession(sessionOutcomes);

            const sessionKeySet = recentSession?.Keyset ?? createNewKeySet(recentSession?.SessionSettings.KeySet ?? '');
            const designerKeySet = keyboards.find((k: KeySet) => k.Name == recentSession?.SessionSettings.KeySet);

            const {
              frequencyKeys: targetedFKeys,
              durationKeys: targetedDKeys,
              derivedKeys: targetedDerivedKeys,
              specialDurationKeys,
              scorableDurationKeys,
            } = extractAndDeduplicateKeysets(sessionOutcomes, {
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

            const keysObserved: ToggleDisplayKey[] = dynamicKeyset.DurationKeys.map((key) => ({
              ...key,
              Visible: true,
              KeyType: 'Observed',
            }));

            const keysScoring: ToggleDisplayKey[] = dynamicKeyset.ScorableDurationKeys.map((key) => ({
              ...key,
              Visible: true,
              KeyType: 'Observed',
            }));

            const keys = [...keysObserved, ...keysScoring];

            const storedPreferences = getLocalCachedPrefs(Group, Individual, Evaluation, 'Duration');
            const showKeysBase = mapKeysWithStoragePreference(keys, storedPreferences);

            let minX = 0;
            let maxX = 1;

            if (resultsFiltered.length > 0) {
              minX = Math.min(...resultsFiltered.map((r) => r.SessionSettings.Session));
              maxX = Math.max(...resultsFiltered.map((r) => r.SessionSettings.Session));
            }

            // Note: normal scoring here?
            const scoringOptions = filteredSessionScoringOptions(Settings, dynamicKeyset, true, false);
            const timerMapping =
              scoringOptions.find((i) => i.value === storedPreferences?.Schedule) ?? scoringOptions[0];

            return (
              <ResultsProportionVisualsPage
                Group={Group}
                Individual={Individual}
                Evaluation={Evaluation}
                Conditions={conditions}
                Results={sessionOutcomes}
                ResultsFiltered={resultsFiltered}
                Handle={Handle}
                MinX={minX}
                MaxX={maxX}
                DynamicKeySet={dynamicKeyset}
                TimerMapping={timerMapping}
                ShowKeys={showKeysBase}
                Settings={Settings}
              />
            );
          }
        }
      </Await>
    </PageWrapper>
  );
}
