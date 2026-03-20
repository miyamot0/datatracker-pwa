import { getLocalCachedPrefs } from '@/lib/local_storage';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import {
  extractAndDeduplicateKeysets,
  filterSessionsByPrimaryRole,
  mapKeysWithStoragePreference,
} from '@/lib/graphing';
import { pullMostRecentSession } from '@/lib/keyset';
import { ToggleDisplayKey } from '@/types/visuals';
import ResultsProportionVisualsPage from '@/components/pages/visualize-outcomes/proportion/results-proportion-visuals-page';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/proportion')({
  beforeLoad: ({ context, params }) => {
    if (!context.folderHandleContext.isInitialized) {
      throw redirect({
        href: '/',
      });
    }

    if (!context.folderHandleContext.handle) {
      throw redirect({
        href: '/dashboard',
      });
    }

    const { group, individual, evaluation } = params;

    if (!group || !individual || !evaluation) {
      throw redirect({
        href: '/dashboard',
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
    const { group, individual, evaluation, cleanHandle } = context;

    const results = await context.queryClient.ensureQueryData(
      sessionOutcomesQueryOptions(cleanHandle, group, individual, evaluation),
    );

    const keyboards = await context.queryClient.ensureQueryData(keyboardQueryOptions(cleanHandle, group, individual));

    // Note: base to pull from
    const recentKeysetName = pullMostRecentSession(results);

    // Pull most up-to-date keyboard
    const latestKeyset = keyboards.find((kb) => kb.Name === recentKeysetName.SessionSettings.KeySet);

    if (!latestKeyset) {
      throw redirect({
        href: '/dashboard',
      });
    }

    const {
      frequencyKeys: targetedFKeys,
      durationKeys: targetedDKeys,
      //derivedKeys: targetedDerivedKeys,
    } = extractAndDeduplicateKeysets(results, latestKeyset);

    const dynamicKeyset = {
      ...latestKeyset,
      FrequencyKeys: targetedFKeys,
      DurationKeys: targetedDKeys,
    } as unknown as KeySet;

    const keys: ToggleDisplayKey[] = dynamicKeyset.DurationKeys.map((key) => ({
      ...key,
      Visible: true,
      KeyType: 'Observed',
    }));

    const storedPreferences = getLocalCachedPrefs(group, individual, evaluation, 'Duration');
    const showKeysBase = mapKeysWithStoragePreference(keys, storedPreferences);

    const resultsFiltered = filterSessionsByPrimaryRole(results);

    let minX = 0;
    let maxX = 1;

    if (resultsFiltered.length > 0) {
      minX = Math.min(...resultsFiltered.map((r) => r.SessionSettings.Session));
      maxX = Math.max(...resultsFiltered.map((r) => r.SessionSettings.Session));
    }

    return {
      Group: group,
      Individual: individual,
      Evaluation: evaluation,
      Handle: cleanHandle,
      Results: results,
      ResultsFiltered: resultsFiltered,
      MinX: minX,
      MaxX: maxX,
      DynamicKeySet: dynamicKeyset,
      ShowKeys: showKeysBase,
      Schedule: storedPreferences.Schedule ?? 'End on Timer #1',
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, Results, ResultsFiltered, MinX, MaxX, DynamicKeySet, Schedule, ShowKeys } =
    Route.useLoaderData();

  return (
    <ResultsProportionVisualsPage
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      Results={Results}
      ResultsFiltered={ResultsFiltered}
      MinX={MinX}
      MaxX={MaxX}
      DynamicKeySet={DynamicKeySet}
      Schedule={Schedule}
      ShowKeys={ShowKeys}
    />
  );
}
