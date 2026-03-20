import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
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

export const Route = createFileRoute('/session/$group/$individual/$evaluation/rate')({
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
          ...key,
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
