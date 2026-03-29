import { CleanUpString } from '@/lib/strings';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import { pullMostRecentSession } from '@/lib/keyset';
import { extractAndDeduplicateKeysets, mapKeysWithStoragePreference } from '@/lib/graphing';
import { KeySet } from '@/types/keyset';
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
import { ErrorDisplay } from '@/components/elements/suspense/error-display';
import ResultsViewerContent from '@/components/pages/summary-outcomes/results-viewer-content';
import { filteredSessionScoringOptions } from '@/types/schedules';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/view')({
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
    const { CleanHandle, Group, Individual, Evaluation, Settings } = context;

    const fetchKeyboards = context.queryClient.fetchQuery(keyboardQueryOptions(CleanHandle, Group, Individual));
    const fetchSessionOutcomes = context.queryClient.fetchQuery(
      sessionOutcomesQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    const totalQuery = Promise.all([fetchKeyboards, fetchSessionOutcomes]);

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
            const recentKeysetName = pullMostRecentSession(sessionOutcomes);

            const sessionKeySet = recentKeysetName.Keyset;
            const designerKeySet = keyboards.find((k: KeySet) => k.Name == recentKeysetName.SessionSettings.KeySet);

            if (!sessionKeySet) {
              return <ErrorDisplay Text={'Relevant keyset not found.'} />;
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
