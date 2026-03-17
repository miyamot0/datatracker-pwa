import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { routeGuard } from '@/lib/routing';
import ResultsViewerPage from '@/components/pages/summary-outcomes/results-viewer-page';

export const Route = createFileRoute(
  '/session/$group/$individual/$evaluation/view',
)({
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

  return <ResultsViewerPage Group={Group} Individual={Individual} Evaluation={Evaluation} />;
}
