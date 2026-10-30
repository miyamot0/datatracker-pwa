import { CleanUpString } from '@/lib/strings';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import { routeGuard } from '@/lib/routing';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import { pullMostRecentSession } from '@/lib/keyset';
import { extractAndDeduplicateKeysets, mapKeysWithStoragePreference } from '@/lib/graphing/keyset-utils';
import { KeySet } from '@/types/keyset/core';
import { ToggleDisplayKey } from '@/types/visuals';
import { getLocalCachedPrefs } from '@/lib/local_storage';
import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { LoadingDisplay } from '@/components/elements/suspense/loading-display';
import { ModifiedSessionResult } from '@/types/storage';
import ResultsViewerContent from '@/components/pages/summary-outcomes/results-viewer-content';
import ResultsViewerBlank from '@/components/pages/summary-outcomes/views/results-viewer-blank';
import { filteredSessionScoringOptions } from '@/types/schedules';

import { trackSettlement } from '@/lib/settle-tracking';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/view')({
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
  loader: async ({ context }) => {
    const { CleanHandle, Group, Individual, Evaluation, Settings } = context;

    const fetchKeyboards = context.queryClient.query(keyboardQueryOptions(CleanHandle, Group, Individual));
    const fetchSessionOutcomes = context.queryClient.query(
      sessionOutcomesQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    const totalQuery = trackSettlement(Promise.all([fetchKeyboards, fetchSessionOutcomes]));

    return {
      Group: Group,
      Individual: Individual,
      Evaluation: Evaluation,
      Settings,
      CleanHandle,
      totalQuery,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, Settings, totalQuery } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(CleanUpString(Group), CleanUpString(Individual)),
      ]}
      label={`View ${CleanUpString(CleanUpString(Evaluation))} Data`}
      className="select-none"
      Settings={Settings}
    >
      <Await promise={totalQuery} fallback={<LoadingDisplay />}>
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (results: any[]) => {
            const keyboards: KeySet[] = results[0];
            const sessionOutcomes: ModifiedSessionResult[] = results[1];
            // No sessions yet: show the blank card, matching reli
            if (sessionOutcomes.length < 1) {
              return <ResultsViewerBlank />;
            }

            const recentSession = pullMostRecentSession(sessionOutcomes);

            const sessionKeySet = recentSession.Keyset;
            const designerKeySet = keyboards.find((k: KeySet) => k.Name == recentSession.SessionSettings.KeySet);

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

            const keysFreqObserved: ToggleDisplayKey[] = dynamicKeyset.FrequencyKeys.map(
              (key) =>
                ({
                  ...key,
                  Visible: true,
                  KeyType: 'Observed',
                }) satisfies ToggleDisplayKey,
            );

            const keysFreqDerived: ToggleDisplayKey[] = dynamicKeyset.DerivedKeys?.map(
              (key) =>
                ({
                  KeyName: key.name,
                  KeyDescription: key.name,
                  KeyCode: -1,
                  Visible: true,
                  KeyType: 'Derived',
                }) satisfies ToggleDisplayKey,
            );

            const storedPreferences = getLocalCachedPrefs(Group, Individual, Evaluation, 'Rate');
            const showKeysFreq = mapKeysWithStoragePreference(
              [...keysFreqObserved, ...keysFreqDerived],
              storedPreferences,
            );

            const keyDurationObserved: ToggleDisplayKey[] = dynamicKeyset.DurationKeys.map(
              (key) =>
                ({
                  ...key,
                  Visible: true,
                  KeyType: 'Observed',
                }) satisfies ToggleDisplayKey,
            );

            const keyDurationScoring: ToggleDisplayKey[] = dynamicKeyset.ScorableDurationKeys?.map(
              (key) =>
                ({
                  ...key,
                  Visible: true,
                  KeyType: 'Observed',
                }) satisfies ToggleDisplayKey,
            );

            const storedPreferencesD = getLocalCachedPrefs(Group, Individual, Evaluation, 'Duration');
            const showKeysDuration = mapKeysWithStoragePreference(
              [...keyDurationObserved, ...keyDurationScoring],
              storedPreferencesD,
            );

            const scoringOptions = filteredSessionScoringOptions(Settings, dynamicKeyset, true, true);
            const timerMapping =
              scoringOptions.find((i) => i.value === storedPreferences?.Schedule) ?? scoringOptions[0];

            return (
              <ResultsViewerContent
                TimerMapping={timerMapping}
                Results={sessionOutcomes}
                Keyset={dynamicKeyset}
                ShowKeysFreq={showKeysFreq}
                ShowKeysDuration={showKeysDuration}
                Group={Group}
                Individual={Individual}
                Evaluation={Evaluation}
                Settings={Settings}
              />
            );
          }
        }
      </Await>
    </PageWrapper>
  );
}
