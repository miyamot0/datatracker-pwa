import { getLocalCachedPrefs } from '@/lib/local_storage';
import { CleanUpString } from '@/lib/strings';
import { KeySet } from '@/types/keyset';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
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
import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { ModifiedSessionResult } from '@/types/storage';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/proportion')({
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
  const { Group, Individual, Evaluation, Settings, totalQuery } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(CleanUpString(Group)),
        BuildEvaluationsBreadcrumb(CleanUpString(Group), CleanUpString(Individual)),
      ]}
      label={`${CleanUpString(CleanUpString(Evaluation))}: Interval Proportions`}
      className="select-none"
      Settings={Settings}
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
            } = extractAndDeduplicateKeysets(sessionOutcomes, {
              ...sessionKeySet,
              FrequencyKeys: [],
              DurationKeys: [...sessionKeySet.DurationKeys, ...(designerKeySet?.DurationKeys || [])],
              DerivedKeys: [...(sessionKeySet.DerivedKeys || []), ...(designerKeySet?.DerivedKeys || [])],
              // Note: No need for these here for now
              SpecialDurationKeys: [],
            });

            const dynamicKeyset = {
              ...sessionKeySet,
              FrequencyKeys: targetedFKeys,
              DurationKeys: targetedDKeys,
              DerivedKeys: targetedDerivedKeys,
              SpecialDurationKeys: specialDurationKeys,
            } satisfies KeySet;

            const keys: ToggleDisplayKey[] = dynamicKeyset.DurationKeys.map((key) => ({
              ...key,
              Visible: true,
              KeyType: 'Observed',
            }));

            const storedPreferences = getLocalCachedPrefs(Group, Individual, Evaluation, 'Duration');
            const showKeysBase = mapKeysWithStoragePreference(keys, storedPreferences);

            let minX = 0;
            let maxX = 1;

            if (resultsFiltered.length > 0) {
              minX = Math.min(...resultsFiltered.map((r) => r.SessionSettings.Session));
              maxX = Math.max(...resultsFiltered.map((r) => r.SessionSettings.Session));
            }

            return (
              <ResultsProportionVisualsPage
                Group={Group}
                Individual={Individual}
                Evaluation={Evaluation}
                Results={sessionOutcomes}
                ResultsFiltered={resultsFiltered}
                MinX={minX}
                MaxX={maxX}
                DynamicKeySet={dynamicKeyset}
                Schedule={storedPreferences.Schedule ?? 'End on Timer #1'}
                ShowKeys={showKeysBase}
                Settings={Settings}
              />
            );
          }
        }
      </Await>
    </PageWrapper>
  );
}
