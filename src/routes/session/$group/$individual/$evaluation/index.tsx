import PageWrapper from '@/components/elements/page-wrapper';
import SessionDesignerForm from '@/components/pages/editor-session/session-designer-form';
import { LoadingDisplay } from '@/components/elements/suspense/loading-display';
import {
  BuildGroupBreadcrumb,
  BuildIndividualsBreadcrumb,
  BuildEvaluationsBreadcrumb,
} from '@/components/ui/breadcrumb-entries';
import { CleanUpString } from '@/lib/strings';
import { conditionQueryOptions } from '@/queries/conditions/query-conditions';
import { keyboardQueryOptions } from '@/queries/keysets/query-keyboards';
import { sessionQueryOptions } from '@/queries/session/query-session-params';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';
import { routeGuard } from '@/lib/routing';

import { trackSettlement } from '@/lib/settle-tracking';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/')({
  beforeLoad: ({ context, params }) => {
    const guarded = routeGuard({ context });

    const { group, individual, evaluation } = params;

    if (!group || !individual || !evaluation) {
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
    };
  },
  loader: ({ context }) => {
    const { Group, Individual, Evaluation, CleanHandle } = context;

    const fetchConditions = context.queryClient.query(
      conditionQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    const fetchKeyboards = context.queryClient.query(keyboardQueryOptions(CleanHandle, Group, Individual));

    const fetchSessionParams = context.queryClient.query(
      sessionQueryOptions(CleanHandle, Group, Individual, Evaluation),
    );

    const totalQuery = trackSettlement(Promise.all([fetchConditions, fetchKeyboards, fetchSessionParams]));

    return {
      Group: Group,
      Individual: Individual,
      Evaluation: Evaluation,
      Settings: context.Settings,
      CleanHandle,
      totalQuery,
    };
  },

  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, CleanHandle, Settings, totalQuery } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[
        BuildGroupBreadcrumb(),
        BuildIndividualsBreadcrumb(Group),
        BuildEvaluationsBreadcrumb(Group, Individual),
      ]}
      label={`Design ${CleanUpString(Evaluation)} Session`}
      className="select-none"
      Settings={Settings}
    >
      <Await promise={totalQuery} fallback={<LoadingDisplay />}>
        {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (clients: any[]) => {
            const [conditions, keysets, sessionParams] = clients;

            return (
              <SessionDesignerForm
                Group={Group}
                Individual={Individual}
                Evaluation={Evaluation}
                Conditions={conditions}
                Keysets={keysets}
                SessionSettings={sessionParams}
                Settings={Settings}
                Handle={CleanHandle}
              />
            );
          }
        }
      </Await>
    </PageWrapper>
  );
}
