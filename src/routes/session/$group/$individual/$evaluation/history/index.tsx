import DashboardHistoryPage from '@/components/pages/dashboard-outcomes/dashboard-history-page';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/history/')({
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

    const { group, individual, evaluation } = params;

    if (!group || !individual || !evaluation) {
      throw redirect({
        href: '/dashboard',
      });
    }

    return {
      cleanHandle: context.folderHandleContext.handle,
      group: CleanUpString(group),
      individual: CleanUpString(individual),
      evaluation: CleanUpString(evaluation),
    };
  },
  loader: ({ context }) => {
    const { group, individual, evaluation } = context;

    return {
      Group: group,
      Individual: individual,
      Evaluation: evaluation,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation } = Route.useLoaderData();

  return <DashboardHistoryPage Group={Group} Individual={Individual} Evaluation={Evaluation} />;
}
