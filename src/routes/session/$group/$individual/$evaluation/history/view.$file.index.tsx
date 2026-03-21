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
import { generateTicks } from '@/lib/graphing';
import { pullMostRecentKeySet } from '@/lib/keyset';
import { combineAndSortKeyPresses } from '@/lib/schedule-parser';
import { preparePlotDataCumulative } from '@/lib/summary';
import { GenerateSavedFileName } from '@/lib/writer';
import { EnhancedKeySetInstance, KeySet } from '@/types/keyset';
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

          const keySet = keysets.find((k: KeySet) => k.Name == sessionParams.KeySet);

          if (!keySet) {
            return <ErrorDisplay Text={'Relevant keyset not found.'} />;
          }

          // TODO: The most recent should be the one from the session designer (Fixed)
          //const keySet = pullMostRecentKeySet(sessions);
          //const { UnfilteredKeysFrequency } = prepareDataOrganization(Group, Individual, Evaluation, keySet);
          const plot_object = preparePlotDataCumulative(relevantSession);

          const yValues = plot_object
            .map((point) => {
              const keys = Object.keys(point).filter((k) => k !== 'second');

              return keys.map((key) => point[key]);
            })
            .flat();

          const maxYValue = Math.max(...yValues) + 1;
          const yTicks = generateTicks(maxYValue, 0);

          const expandedSessionData = {
            ...relevantSession,
            Filename: GenerateSavedFileName(relevantSession.SessionSettings),
            MaxY: maxYValue,
            YTicks: yTicks,
            PlottedKeys: combineAndSortKeyPresses(relevantSession),
          } satisfies ExpandedSavedSessionResult;

          // Note: All visible by default, then apply user preferences to hide keys as needed
          const enhancedKeySetF: EnhancedKeySetInstance[] = keySet.FrequencyKeys.map((key) => ({
            ...key,
            Visible: true,
            Type: 'Key',
          }));

          // Pull stored preferences for both frequency and duration keys
          const stored_prefs_F = getLocalCachedPrefs(Group, Individual, Evaluation, 'Rate');

          // Conditionally set these to false based on user preferences for both frequency and duration keys
          const baseUnfilteredKeysF = [...enhancedKeySetF].map((key) => {
            const should_disable = stored_prefs_F.KeyDescription.includes(key.KeyDescription);

            if (should_disable) {
              return {
                ...key,
                Visible: false,
              } satisfies EnhancedKeySetInstance;
            }

            return key;
          });

          // Note: No CTB here
          const showKeysBase = baseUnfilteredKeysF
            .filter((k) => k.Type !== 'Summary')
            .map(
              (key) =>
                ({
                  KeyName: key.KeyName,
                  KeyCode: key.KeyCode,
                  KeyDescription: key.KeyDescription,
                  Visible: key.Visible,
                  KeyType: 'Observed' as 'Observed' | 'Derived',
                }) satisfies ToggleDisplayKey,
            );

          return (
            <SessionViewerContent
              Group={Group}
              Individual={Individual}
              Evaluation={Evaluation}
              ShowKeys={showKeysBase}
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
