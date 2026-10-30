import { CleanUpString } from '@/lib/strings';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import { routeGuard } from '@/lib/routing';
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
import { LoadingDisplay } from '@/components/elements/suspense/loading-display';
import { RouteErrorRedirect } from '@/components/pages/error/route-error-view';
import { KeySet } from '@/types/keyset/core';

import { trackSettlement } from '@/lib/settle-tracking';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/run/$keyset')({
  beforeLoad: ({ context, params }) => {
    const guarded = routeGuard({ context });

    const { group, individual, evaluation, keyset } = params;

    if (!group || !individual || !evaluation || !keyset) {
      throw redirect({
        to: '/dashboard',
      });
    }

    return {
      CleanHandle: guarded.handle,
      Settings: guarded.settings,
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      Evaluation: CleanUpString(evaluation),
      Keyset: CleanUpString(keyset),
    };
  },
  loader: ({ context }) => {
    const { Group, Individual, Evaluation, Keyset, Settings, CleanHandle } = context;

    const fetchKeyboards = context.queryClient.query(keyboardQueryOptions(CleanHandle, Group, Individual));
    const fetchSessionParams = context.queryClient.query(
      sessionQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    const totalQuery = trackSettlement(Promise.all([fetchKeyboards, fetchSessionParams]));

    return {
      Group: Group,
      Individual: Individual,
      Evaluation: Evaluation,
      Keyset: Keyset,
      Settings: Settings,
      CleanHandle: CleanHandle,
      ApplicationSettings: Settings,
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
      Settings={Settings}
      HideFooter={Settings.ApplicationFooterDisplay === 'NonSession'}
      HideNavbar={Settings.SessionDisplay === 'FullScreen'}
    >
      <Await promise={totalQuery} fallback={<LoadingDisplay />}>
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (results: any[]) => {
            const [keysets, sessionParams] = results;

            const currentKeySet = keysets.find((k: KeySet) => k.Name == Keyset);

            if (!currentKeySet) return <RouteErrorRedirect message={'KeySet not found.'} />;

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
