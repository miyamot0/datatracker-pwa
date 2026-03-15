import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import SessionManagerPage from '../components/editor-session-outcome/session-manager-page';
import { routeGuard } from '@/lib/routing';

export const Route = createFileRoute('/session_/$group/$individual/$evaluation/history/edit/$file')({
  beforeLoad: routeGuard,
  loader: async ({ params }) => {
    const { group, individual, evaluation, file } = params;

    if (!group || !individual || !evaluation || !file) {
      throw redirect({
        href: createHref({ type: 'Dashboard' }),
      });
    }

    const FileString = CleanUpString(file);

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      Evaluation: CleanUpString(evaluation),
      FileString,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, FileString } = Route.useLoaderData();

  return <SessionManagerPage Group={Group} Individual={Individual} Evaluation={Evaluation} FileString={FileString} />;
}
