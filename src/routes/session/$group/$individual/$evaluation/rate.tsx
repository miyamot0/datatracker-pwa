import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { KeySet } from '@/types/keyset';
import { getLocalCachedPrefs } from '@/lib/local_storage';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { routeGuard } from '@/lib/routing';
import {
  createCTBKeyWithPreferences,
  extractAndDeduplicateKeysets,
  filterSessionsByPrimaryRole,
  mapKeysWithStoragePreference,
} from '@/lib/graphing';
import { pullMostRecentKeySet } from '@/lib/keyset';
import { ToggleDisplayKey } from '@/types/visuals';
import ResultsRateVisualsPage from '@/components/pages/visualize-outcomes/rate/results-rate-visuals-page';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/rate')({
  beforeLoad: routeGuard,
  loader: async ({ params, context }) => {
    const { group, individual, evaluation } = params;
    const { handle } = context.folderHandleContext;

    if (!group || !individual || !evaluation || !handle) {
      throw redirect({
        href: '/dashboard',
      });
    }

    const results = await context.queryClient.ensureQueryData(
      sessionOutcomesQueryOptions(handle, group, individual, evaluation),
    );

    // Note: base to pull from
    const keyset = pullMostRecentKeySet(results);

    if (!keyset) {
      throw redirect({
        href: '/dashboard',
      });
    }

    // Extract and deduplicate keysets using discrete function
    const { frequencyKeys: targetedFKeys, durationKeys: targetedDKeys } = extractAndDeduplicateKeysets(results);

    const dynamicKeyset = {
      ...keyset,
      FrequencyKeys: targetedFKeys,
      DurationKeys: targetedDKeys,
    } as unknown as KeySet;

    const keys: ToggleDisplayKey[] = dynamicKeyset.FrequencyKeys.map((key) => ({
      KeyDescription: key.KeyDescription,
      Visible: true,
    }));

    const storedPreferences = getLocalCachedPrefs(group, individual, evaluation, 'Rate');
    const { ctbEntry, excludeFromCTB } = createCTBKeyWithPreferences(keys, storedPreferences);
    const showKeysBase = mapKeysWithStoragePreference([...keys, ctbEntry], storedPreferences);

    const resultsFiltered = filterSessionsByPrimaryRole(results);

    let minX = 0;
    let maxX = 1;

    if (resultsFiltered.length > 0) {
      minX = Math.min(...resultsFiltered.map((r) => r.SessionSettings.Session));
      maxX = Math.max(...resultsFiltered.map((r) => r.SessionSettings.Session));
    }

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      Evaluation: CleanUpString(evaluation),
      Handle: handle,
      Results: results,
      ResultsFiltered: resultsFiltered,
      MinX: minX,
      MaxX: maxX,
      DynamicKeySet: dynamicKeyset,
      ShowKeys: showKeysBase,
      ExcludeKeysFromCTB: excludeFromCTB,
      Schedule: storedPreferences.Schedule ?? 'End on Timer #1',
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const {
    Group,
    Individual,
    Evaluation,
    Handle,
    Results,
    ResultsFiltered,
    DynamicKeySet,
    Schedule,
    ShowKeys,
    ExcludeKeysFromCTB,
    MinX,
    MaxX,
  } = Route.useLoaderData();

  return (
    <ResultsRateVisualsPage
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      Handle={Handle}
      Results={Results}
      ResultsFiltered={ResultsFiltered}
      DynamicKeySet={DynamicKeySet}
      Schedule={Schedule}
      ShowKeys={ShowKeys}
      ExcludeKeysFromCTB={ExcludeKeysFromCTB}
      MinX={MinX}
      MaxX={MaxX}
    />
  );
}
