import PageWrapper from '@/components/elements/page-wrapper';
import EvaluationsPage from '@/components/pages/dashboard-evaluations/evaluations-page';
import { LoadingDisplay } from '@/components/suspense/loading-display';
import { BuildGroupBreadcrumb, BuildIndividualsBreadcrumb } from '@/components/ui/breadcrumb-entries';
import { CleanUpString } from '@/lib/strings';
import { evaluationQueryOptions } from '@/queries/evaluations/query-evaluations';
import { Await, createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/')({
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

    const { group, individual } = params;

    if (!group || !individual) {
      throw redirect({
        href: '/dashboard',
      });
    }

    return {
      CleanHandle: context.folderHandleContext.handle,
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
    };
  },
  loader: ({ context }) => {
    const { Group, Individual, CleanHandle } = context;

    const fetchEvaluations = context.queryClient.fetchQuery(evaluationQueryOptions(CleanHandle, Group, Individual));

    return {
      Group,
      Individual,
      Settings: context.folderHandleContext.settings,
      CleanHandle,
      fetchEvaluations,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Settings, CleanHandle, fetchEvaluations } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[BuildGroupBreadcrumb(), BuildIndividualsBreadcrumb(Group)]}
      label={CleanUpString(Individual)}
      Settings={Settings}
      className="select-none"
    >
      <Await promise={fetchEvaluations} fallback={<LoadingDisplay />}>
        {(evaluations: string[]) => (
          <EvaluationsPage
            Group={Group}
            Individual={Individual}
            Evaluations={evaluations}
            Settings={Settings}
            Handle={CleanHandle}
          />
        )}
      </Await>
    </PageWrapper>
  );
}
