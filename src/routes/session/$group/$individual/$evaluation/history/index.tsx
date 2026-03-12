import DashboardHistoryPage from '@/routes/session/$group/$individual/$evaluation/history/-components/dashboard-history-page';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/history/')({
  loader: ({ params, context }) => {
    const { group, individual, evaluation } = params;
    const { routerHandle } = context;

    if (!group || !individual || !evaluation || !routerHandle) {
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
