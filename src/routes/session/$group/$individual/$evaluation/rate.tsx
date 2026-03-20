import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { KeySet } from '@/types/keyset';
import { getLocalCachedPrefs } from '@/lib/local_storage';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { routeGuard } from '@/lib/routing';
import {
  extractAndDeduplicateKeysets,
  filterSessionsByPrimaryRole,
  mapKeysWithStoragePreference,
} from '@/lib/graphing';
import { pullMostRecentSession } from '@/lib/keyset';
import { ToggleDisplayKey } from '@/types/visuals';
import ResultsRateVisualsPage from '@/components/pages/visualize-outcomes/rate/results-rate-visuals-page';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';

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

    const keyboards = await context.queryClient.ensureQueryData(keyboardQueryOptions(handle, group, individual));

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
      derivedKeys: targetedDerivedKeys,
    } = extractAndDeduplicateKeysets(results, latestKeyset);

    const dynamicKeyset = {
      ...latestKeyset,
      FrequencyKeys: targetedFKeys,
      DurationKeys: targetedDKeys,
      DerivedKeys: targetedDerivedKeys,
    } as unknown as KeySet;

    const keys: ToggleDisplayKey[] = dynamicKeyset.FrequencyKeys.map(
      (key) =>
        ({
          ...key,
          Visible: true,
          KeyType: 'Observed',
        }) satisfies ToggleDisplayKey,
    );

    const derivedKeys: ToggleDisplayKey[] = dynamicKeyset.DerivedKeys?.map(
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
    const showKeysBase = mapKeysWithStoragePreference([...keys, ...derivedKeys], storedPreferences);

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
      MinX={MinX}
      MaxX={MaxX}
    />
  );
}
