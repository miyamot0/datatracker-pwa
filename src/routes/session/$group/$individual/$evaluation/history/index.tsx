import DashboardHistoryPage from '@/components/pages/dashboard-outcomes/dashboard-history-page';
import createHref from '@/lib/links';
import { routeGuard } from '@/lib/routing';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/history/')({
  beforeLoad: routeGuard,
  loader: ({ params }) => {
    const { group, individual, evaluation } = params;

    if (!group || !individual || !evaluation) {
      throw redirect({
        href: createHref({ type: 'Dashboard' }),
      });
    }

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      Evaluation: CleanUpString(evaluation),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation } = Route.useLoaderData();

  return <DashboardHistoryPage Group={Group} Individual={Individual} Evaluation={Evaluation} />;
}
