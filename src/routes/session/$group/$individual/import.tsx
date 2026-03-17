import ViewerEvaluationsPage from '@/components/pages/dashboard-evaluations-import/viewer-evaluations-page';
import createHref from '@/lib/links';
import { routeGuard } from '@/lib/routing';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/import')({
  beforeLoad: routeGuard,
  loader: ({ params }) => {
    const { group, individual } = params;

    if (!group || !individual) {
      throw redirect({
        href: createHref({ type: 'Dashboard' }),
      });
    }

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual } = Route.useLoaderData();

  return <ViewerEvaluationsPage Group={Group} Individual={Individual} />;
}
