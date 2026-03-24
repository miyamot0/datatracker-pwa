import { CleanUpString } from '@/lib/strings';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import SessionRecorderPage from '@/components/pages/session-recorder/session-recorder-page';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import { sessionQueryOptions } from '@/queries/session/query-session-params';
import PageWrapper from '@/components/elements/page-wrapper';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
  BuildSessionDesignerBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { ErrorDisplay } from '@/components/suspense/error-display';
import { KeySet } from '@/types/keyset';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/run/$keyset')({
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

    const { group, individual, evaluation, keyset } = params;

    if (!group || !individual || !evaluation || !keyset) {
      throw redirect({
        to: '/dashboard',
      });
    }

    return {
      CleanHandle: context.folderHandleContext.handle,
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      Evaluation: CleanUpString(evaluation),
      Keyset: CleanUpString(keyset),
      Settings: context.folderHandleContext.settings,
    };
  },
  loader: ({ context }) => {
    const { Group, Individual, Evaluation, Keyset, Settings, CleanHandle } = context;

    const fetchKeyboards = context.queryClient.fetchQuery(keyboardQueryOptions(CleanHandle, Group, Individual));
    const fetchSessionParams = context.queryClient.fetchQuery(
      sessionQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    const totalQuery = Promise.all([fetchKeyboards, fetchSessionParams]);

    return {
      Group: Group,
      Individual: Individual,
      Evaluation: Evaluation,
      Keyset: Keyset,
      Settings: Settings,
      CleanHandle: CleanHandle,
      ApplicationSettings: context.folderHandleContext.settings,
      totalQuery,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, Keyset, Settings, CleanHandle, ApplicationSettings, totalQuery } =
    Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
        BuildSessionDesignerBreadcrumb(Group, Individual, Evaluation),
      ]}
      className="select-none"
      HideFooter={Settings.ApplicationFooterDisplay === 'NonSession'}
      HideNavbar={Settings.SessionDisplay === 'FullScreen'}
    >
      <Await promise={totalQuery} fallback={<LoadingDisplay />}>
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (results: any[]) => {
            const [keysets, sessionParams] = results;

            const currentKeySet = keysets.find((k: KeySet) => k.Name == Keyset);

            if (!currentKeySet) return <ErrorDisplay Text={'KeySet not found.'} />;

            return (
              <SessionRecorderPage
                Group={Group}
                Individual={Individual}
                Evaluation={Evaluation}
                KeySetObject={currentKeySet}
                SessionParams={sessionParams}
                Handle={CleanHandle}
                ApplicationSettings={ApplicationSettings}
              />
            );
          }
        }
      </Await>
    </PageWrapper>
  );
}
