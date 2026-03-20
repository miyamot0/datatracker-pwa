import { CleanUpString } from '@/lib/strings';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import ResultsViewerPage from '@/components/pages/summary-outcomes/results-viewer-page';
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
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { ModifiedSessionResult } from '@/types/storage';
import { ErrorDisplay } from '@/components/suspense/error-display';

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
        {(results: any[]) => {
          const keyboards: KeySet[] = results[0];
          const sessionOutcomes: ModifiedSessionResult[] = results[1];
          const recentKeysetName = pullMostRecentSession(sessionOutcomes);
          const latestKeyset = keyboards.find((kb) => kb.Name === recentKeysetName.SessionSettings.KeySet);

          // TODO: The latest keyset should be the last one in the session designer
          if (!latestKeyset) {
            return <ErrorDisplay Text={'KeySet not found.'} />;
          }

          const {
            frequencyKeys: targetedFKeys,
            durationKeys: targetedDKeys,
            derivedKeys: targetedDerivedKeys,
          } = extractAndDeduplicateKeysets(sessionOutcomes, latestKeyset);

          const dynamicKeyset = {
            ...latestKeyset,
            FrequencyKeys: targetedFKeys,
            DurationKeys: targetedDKeys,
            DerivedKeys: targetedDerivedKeys,
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

          const storedPreferencesD = getLocalCachedPrefs(Group, Individual, Evaluation, 'Duration');
          const showKeysDuration = mapKeysWithStoragePreference([...keyDurationObserved], storedPreferencesD);

          return (
            <ResultsViewerPage
              Group={Group}
              Individual={Individual}
              Evaluation={Evaluation}
              Sessions={sessionOutcomes}
              LatestKeySet={dynamicKeyset}
              ShowKeysFreq={showKeysFreq}
              ShowKeysDuration={showKeysDuration}
            />
          );
        }}
      </Await>
    </PageWrapper>
  );
}
