import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import ResultsViewerPage from '@/components/pages/summary-outcomes/results-viewer-page';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import { pullMostRecentSession } from '@/lib/keyset';
import { extractAndDeduplicateKeysets, mapKeysWithStoragePreference } from '@/lib/graphing';
import { KeySet } from '@/types/keyset';
import { ToggleDisplayKey } from '@/types/visuals';
import { getLocalCachedPrefs } from '@/lib/local_storage';

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
      cleanHandle: context.folderHandleContext.handle,
      group: CleanUpString(group),
      individual: CleanUpString(individual),
      evaluation: CleanUpString(evaluation),
    };
  },
  loader: async ({ context }) => {
    const { cleanHandle, group, individual, evaluation } = context;

    const results = await context.queryClient.ensureQueryData(
      sessionOutcomesQueryOptions(cleanHandle, group, individual, evaluation),
    );

    if (results.length === 0) {
      throw redirect({
        to: '/session/$group/$individual',
        params: { group, individual },
      });
    }

    const keyboards = await context.queryClient.ensureQueryData(keyboardQueryOptions(cleanHandle, group, individual));

    // Note: base to pull from
    const recentKeysetName = pullMostRecentSession(results);

    // Pull most up-to-date keyboard
    const latestKeyset = keyboards.find((kb) => kb.Name === recentKeysetName.SessionSettings.KeySet);

    if (!latestKeyset) {
      throw redirect({
        to: '/dashboard',
      });
    }

    const {
      frequencyKeys: targetedFKeys,
      durationKeys: targetedDKeys,
      derivedKeys: targetedDerivedKeys,
    } = extractAndDeduplicateKeysets(results, latestKeyset);

    const dynamicKeyset = {
      ...latestKeyset,
      FrequencyKeys: targetedFKeys,
      DurationKeys: targetedDKeys,
      DerivedKeys: targetedDerivedKeys,
    } as unknown as KeySet;

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

    const storedPreferences = getLocalCachedPrefs(group, individual, evaluation, 'Rate');
    const showKeysFreq = mapKeysWithStoragePreference([...keysFreqObserved, ...keysFreqDerived], storedPreferences);

    const keyDurationObserved: ToggleDisplayKey[] = dynamicKeyset.DurationKeys.map(
      (key) =>
        ({
          ...key,
          Visible: true,
          KeyType: 'Observed',
        }) satisfies ToggleDisplayKey,
    );

    const storedPreferencesD = getLocalCachedPrefs(group, individual, evaluation, 'Duration');
    const showKeysDuration = mapKeysWithStoragePreference([...keyDurationObserved], storedPreferencesD);

    return {
      Group: group,
      Individual: individual,
      Evaluation: evaluation,
      Sessions: results,
      LatestKeySet: dynamicKeyset,
      ShowKeysFreq: showKeysFreq,
      ShowKeysDuration: showKeysDuration,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, Sessions, LatestKeySet, ShowKeysFreq, ShowKeysDuration } =
    Route.useLoaderData();

  return (
    <ResultsViewerPage
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      Sessions={Sessions}
      LatestKeySet={LatestKeySet}
      ShowKeysFreq={ShowKeysFreq}
      ShowKeysDuration={ShowKeysDuration}
    />
  );
}
