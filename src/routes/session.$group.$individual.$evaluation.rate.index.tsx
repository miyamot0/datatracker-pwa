import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import ResultsRateVisualsPage from '../components/visualize-outcomes/rate/results-rate-visuals-page';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { getLocalCachedPrefs } from '@/lib/local_storage';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { routeGuard } from '@/lib/routing';
import { filterSessionsByPrimaryRole } from '@/lib/graphing';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/rate/')({
  beforeLoad: routeGuard,
  loader: async ({ params, context }) => {
    const { group, individual, evaluation } = params;
    const { handle } = context.folderHandleContext;

    if (!group || !individual || !evaluation || !handle) {
      throw redirect({
        href: createHref({ type: 'Dashboard' }),
      });
    }

    const results = await context.queryClient.ensureQueryData(
      sessionOutcomesQueryOptions(handle, group, individual, evaluation),
    );

    const keyset = results[0].Keyset;

    if (!keyset) {
      throw redirect({
        href: createHref({ type: 'Dashboard' }),
      });
    }

    const allKeysets = results.map((result) => result.Keyset);
    const allFKeys = allKeysets.map((keyset) => keyset.FrequencyKeys).flat();
    const allDKeys = allKeysets.map((keyset) => keyset.DurationKeys).flat();

    const targetedFKeys: KeySetInstance[] = [];
    allFKeys.forEach((key) => {
      if (!targetedFKeys.some((k) => k.KeyCode === key.KeyCode)) {
        targetedFKeys.push(key);
      }
    });

    const targetedDKeys: KeySetInstance[] = [];
    allDKeys.forEach((key) => {
      if (!targetedDKeys.some((k) => k.KeyCode === key.KeyCode)) {
        targetedDKeys.push(key);
      }
    });

    const dynamicKeyset = {
      ...keyset,
      FrequencyKeys: targetedFKeys,
      DurationKeys: targetedDKeys,
    } as unknown as KeySet;

    const keys = dynamicKeyset.FrequencyKeys.map((key) => ({
      KeyDescription: key.KeyDescription,
      Visible: true,
    }));

    const storedPreferences = getLocalCachedPrefs(group, individual, evaluation, 'Rate');

    const ctbEntry = {
      KeyDescription: 'CTB',
      Visible: true,
    };

    const showKeysBase = [...keys, ctbEntry].map((key) => {
      const shouldDisable = storedPreferences.KeyDescription.includes(key.KeyDescription);

      if (shouldDisable) {
        return {
          ...key,
          Visible: false,
        };
      }

      return key;
    });

    const excludeFromCTB = keys.map((key) => {
      const shouldDisable = storedPreferences.CTBElements.includes(key.KeyDescription);

      if (shouldDisable) {
        return {
          ...key,
          Visible: false,
        };
      }

      return key;
    });

    const resultsFiltered = filterSessionsByPrimaryRole(results);

    let minX = 0;
    let maxX = 0;

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
