import { CleanUpString } from '@/lib/strings';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
  BuildSessionHistoryBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import { ModifiedSessionResult } from '@/types/storage';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { ExpandedSavedSessionResult, SavedSettings } from '@/lib/dtos';
import { extractAndDeduplicateKeysets, generateTicks, mapKeysWithStoragePreference } from '@/lib/graphing';
import { combineAndSortKeyPresses } from '@/lib/schedule-parser';
import { preparePlotDataCumulative } from '@/lib/summary';
import { GenerateSavedFileName } from '@/lib/writer';
import { KeySet } from '@/types/keyset';
import { getLocalCachedPrefs } from '@/lib/local_storage';
import SessionViewerContent from '@/components/pages/editor-session-outcome/views/session-viewer-content';
import { ToggleDisplayKey } from '@/types/visuals';
import { sessionQueryOptions } from '@/queries/session/query-session-params';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/history/view/$file/')({
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

    const { group, individual, evaluation, file } = params;

    if (!group || !individual || !evaluation || !file) {
      throw redirect({
        to: '/dashboard',
      });
    }

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      Evaluation: CleanUpString(evaluation),
      FileString: CleanUpString(file),
      CleanHandle: context.folderHandleContext.handle,
      Settings: context.folderHandleContext.settings,
    };
  },
  loader: async ({ context }) => {
    const { Group, Individual, Evaluation, FileString, CleanHandle, Settings } = context;

    const fetchSessionOutcomes = context.queryClient.fetchQuery(
      sessionOutcomesQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    const fetchSessionParams = context.queryClient.fetchQuery(
      sessionQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    const fetchKeyboards = context.queryClient.fetchQuery(keyboardQueryOptions(CleanHandle, Group, Individual));

    const totalQuery = Promise.all([fetchSessionOutcomes, fetchSessionParams, fetchKeyboards]);

    return {
      Group,
      Individual,
      Evaluation,
      FileString,
      totalQuery,
      Settings,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, FileString, totalQuery, Settings } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildSessionHistoryBreadcrumb(Group, Individual, Evaluation),
      ]}
      label={'Session Viewer'}
      className="select-none"
      Settings={Settings}
    >
      <Await promise={totalQuery} fallback={<LoadingDisplay />}>
        {([sessions, sessionParams, keysets]: [ModifiedSessionResult[], SavedSettings, KeySet[]]) => {
          const relevantSession = sessions.find((s) => s.Filename.startsWith(FileString));

          if (!relevantSession) {
            return <ErrorDisplay Text={'Session not found.'} />;
          }

          if (!sessionParams) {
            return <ErrorDisplay Text={'Session parameters not found.'} />;
          }

          const sessionKeySet = keysets.find((k: KeySet) => k.Name == relevantSession.Keyset.Name);
          const designerKeySet = keysets.find((k: KeySet) => k.Name == sessionParams.KeySet);

          if (!sessionKeySet) {
            return <ErrorDisplay Text={'Relevant keyset not found.'} />;
          }

          const {
            frequencyKeys: targetedFKeys,
            durationKeys: targetedDKeys,
            derivedKeys: targetedDerivedKeys,
            specialDurationKeys,
          } = extractAndDeduplicateKeysets(sessions, {
            ...sessionKeySet,
            FrequencyKeys: [...sessionKeySet.FrequencyKeys, ...(designerKeySet?.FrequencyKeys || [])],
            DurationKeys: [...sessionKeySet.DurationKeys, ...(designerKeySet?.DurationKeys || [])],
            DerivedKeys: [...sessionKeySet.DerivedKeys, ...(designerKeySet?.DerivedKeys || [])],
            SpecialDurationKeys: [
              ...(sessionKeySet.SpecialDurationKeys || []),
              ...(designerKeySet?.SpecialDurationKeys || []),
            ],
          });

          const dynamicKeyset = {
            ...sessionKeySet,
            FrequencyKeys: targetedFKeys,
            DurationKeys: targetedDKeys,
            DerivedKeys: targetedDerivedKeys,
            SpecialDurationKeys: specialDurationKeys,
          } satisfies KeySet;

          const revisedSession = {
            ...relevantSession,
            Keyset: dynamicKeyset,
          };

          const plot_object = preparePlotDataCumulative(revisedSession);

          const yValues = plot_object
            .map((point) => {
              const keys = Object.keys(point).filter((k) => k !== 'second');

              return keys.map((key) => point[key]);
            })
            .flat();

          const maxYValue = Math.max(...yValues) + 1;
          const yTicks = generateTicks(maxYValue, 0);

          const expandedSessionData = {
            ...revisedSession,
            Keyset: dynamicKeyset,
            Filename: GenerateSavedFileName(revisedSession.SessionSettings),
            MaxY: maxYValue,
            YTicks: yTicks,
            PlottedKeys: combineAndSortKeyPresses(revisedSession),
          } satisfies ExpandedSavedSessionResult;

          // Note: All visible by default, then apply user preferences to hide keys as needed
          const keysFreqObserved: ToggleDisplayKey[] = dynamicKeyset.FrequencyKeys.map(
            (key) =>
              ({
                ...key,
                Visible: true,
                KeyType: 'Observed',
              }) satisfies ToggleDisplayKey,
          );

          const storedPreferences = getLocalCachedPrefs(Group, Individual, Evaluation, 'Rate');
          const showKeysFreq = mapKeysWithStoragePreference([...keysFreqObserved], storedPreferences);

          return (
            <SessionViewerContent
              Group={Group}
              Individual={Individual}
              Evaluation={Evaluation}
              ShowKeys={showKeysFreq}
              ExpandedSession={expandedSessionData}
              PlotObject={plot_object}
              Settings={Settings}
            />
          );
        }}
      </Await>
    </PageWrapper>
  );
}
