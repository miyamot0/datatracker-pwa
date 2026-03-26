import { CleanUpString } from '@/lib/strings';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import { KeySet } from '@/types/keyset';
import { getLocalCachedPrefs } from '@/lib/local_storage';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import {
  extractAndDeduplicateKeysets,
  filterSessionsByPrimaryRole,
  mapKeysWithStoragePreference,
} from '@/lib/graphing';
import { pullMostRecentSession } from '@/lib/keyset';
import { ToggleDisplayKey } from '@/types/visuals';
import ResultsRateVisualsPage from '@/components/pages/visualize-outcomes/rate/results-rate-visuals-page';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { ModifiedSessionResult } from '@/types/storage';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { filteredSessionScoringOptions } from '@/types/schedules';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/rate')({
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

    const totalQuery = Promise.all([fetchKeyboards, fetchSessionOutcomes]);

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
  const { Group, Individual, Evaluation, Handle, totalQuery, Settings } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={`${Evaluation}: Target Rates`}
      className="select-none"
    >
      <Await promise={totalQuery} fallback={<LoadingDisplay />}>
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (results: any[]) => {
            const keyboards: KeySet[] = results[0];
            const sessionOutcomes: ModifiedSessionResult[] = results[1];

            const resultsFiltered = filterSessionsByPrimaryRole(sessionOutcomes);

            const recentKeysetName = pullMostRecentSession(sessionOutcomes);

            const sessionKeySet = recentKeysetName.Keyset;
            const designerKeySet = keyboards.find((k: KeySet) => k.Name == recentKeysetName.SessionSettings.KeySet);

            if (!sessionKeySet) {
              return <ErrorDisplay Text={'KeySet not found.'} />;
            }

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

            let minX = 0;
            let maxX = 1;

            if (resultsFiltered.length > 0) {
              minX = Math.min(...resultsFiltered.map((r) => r.SessionSettings.Session));
              maxX = Math.max(...resultsFiltered.map((r) => r.SessionSettings.Session));
            }

            const scoringOptions = filteredSessionScoringOptions(Settings, dynamicKeyset, true, true);
            const timerMapping =
              scoringOptions.find((i) => i.value === storedPreferences?.Schedule) ?? scoringOptions[0];

            return (
              <ResultsRateVisualsPage
                Group={Group}
                Individual={Individual}
                Evaluation={Evaluation}
                Handle={Handle}
                Results={sessionOutcomes}
                ResultsFiltered={resultsFiltered}
                DynamicKeySet={dynamicKeyset}
                TimerMapping={timerMapping}
                ShowKeys={showKeysFreq}
                MinX={minX}
                MaxX={maxX}
                Settings={Settings}
              />
            );
          }
        }
      </Await>
    </PageWrapper>
  );
}
