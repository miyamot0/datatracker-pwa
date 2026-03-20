import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { routeGuard } from '@/lib/routing';
import SessionViewerPage from '@/components/pages/editor-session-outcome/session-viewer-page';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/history/view/$file/')({
  beforeLoad: routeGuard,
  loader: async ({ params }) => {
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
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, FileString } = Route.useLoaderData();

  return <SessionViewerPage Group={Group} Individual={Individual} Evaluation={Evaluation} FileString={FileString} />;
}
