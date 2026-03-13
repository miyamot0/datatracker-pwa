import createHref from '@/lib/links';
import { getLocalCachedPrefs } from '@/lib/local_storage';
import { CleanUpString } from '@/lib/strings';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { createFileRoute, redirect } from '@tanstack/react-router';
import ResultsProportionVisualsPage from '../components/visualize-outcomes/proportion/results-proportion-visuals-page';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { routeGuard } from '@/lib/routing';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/proportion/')({
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

    const all_keysets = results.map((result) => result.Keyset);
    const all_fkeys = all_keysets.map((keyset) => keyset.FrequencyKeys).flat();
    const all_dkeys = all_keysets.map((keyset) => keyset.DurationKeys).flat();

    const targeted_fkeys: KeySetInstance[] = [];
    all_fkeys.forEach((key) => {
      if (!targeted_fkeys.some((k) => k.KeyCode === key.KeyCode)) {
        targeted_fkeys.push(key);
      }
    });

    const targeted_dkeys: KeySetInstance[] = [];
    all_dkeys.forEach((key) => {
      if (!targeted_dkeys.some((k) => k.KeyCode === key.KeyCode)) {
        targeted_dkeys.push(key);
      }
    });

    const dynamic_keyset = {
      ...keyset,
      FrequencyKeys: targeted_fkeys,
      DurationKeys: targeted_dkeys,
    } as unknown as KeySet;

    const keys = dynamic_keyset.DurationKeys.map((key) => ({
      KeyDescription: key.KeyDescription,
      Visible: true,
    }));

    const stored_prefs = getLocalCachedPrefs(group, individual, evaluation, 'Duration');

    const show_keys_base = keys.map((key) => {
      const should_disable = stored_prefs.KeyDescription.includes(key.KeyDescription);

      if (should_disable) {
        return {
          ...key,
          Visible: false,
        };
      }

      return key;
    });

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      Evaluation: CleanUpString(evaluation),
      Handle: handle,
      Results: results,
      DynamicKeySet: dynamic_keyset,
      ShowKeys: show_keys_base,
      Schedule: stored_prefs.Schedule ?? 'End on Timer #1',
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, Results, DynamicKeySet, Schedule, ShowKeys } = Route.useLoaderData();

  return (
    <ResultsProportionVisualsPage
      Group={Group}
      Individual={Individual}
      Evaluation={Evaluation}
      Results={Results}
      DynamicKeySet={DynamicKeySet}
      Schedule={Schedule}
      ShowKeys={ShowKeys}
    />
  );
}
