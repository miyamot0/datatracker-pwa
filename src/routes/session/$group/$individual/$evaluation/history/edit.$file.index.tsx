import { CleanUpString } from '@/lib/strings';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import { sessionOutcomesQueryOptions } from '@/queries/outcomes/query-session-outcomes';
import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
  BuildSessionHistoryBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { ModifiedSessionResult } from '@/types/storage';
import SessionManagerContent from '@/components/pages/editor-session-outcome/session-manager-content';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { combineAndSortKeyPresses } from '@/lib/schedule-parser';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/history/edit/$file/')({
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

    return {
      Group,
      Individual,
      Evaluation,
      FileString,
      Handle: CleanHandle,
      fetchSessionOutcomes,
      Settings,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, FileString, fetchSessionOutcomes, Handle } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildSessionHistoryBreadcrumb(Group, Individual, Evaluation),
      ]}
      label={'Session Manager'}
      className="select-none"
    >
      <Await promise={fetchSessionOutcomes} fallback={<LoadingDisplay />}>
        {(sessions: ModifiedSessionResult[]) => {
          const relevantSession = sessions.find((s) => s.Filename.startsWith(FileString));

          if (!relevantSession) {
            return <ErrorDisplay Text={'Session not found.'} />;
          }

          const savedKeys = combineAndSortKeyPresses(relevantSession);

          return (
            <SessionManagerContent
              Group={Group}
              Individual={Individual}
              Evaluation={Evaluation}
              Session={relevantSession}
              SavedKeys={savedKeys}
              Handle={Handle}
            />
          );
        }}
      </Await>
    </PageWrapper>
  );
}
