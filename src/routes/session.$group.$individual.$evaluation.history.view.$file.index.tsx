import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import SessionViewerPage from '../components/editor-session-outcome/session-viewer-page';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/history/view/$file/')({
  loader: async ({ params, context }) => {
    const { group, individual, evaluation, file } = params;
    const { routerHandle } = context;

    if (!group || !individual || !evaluation || !file || !routerHandle.handle) {
      throw redirect({
        href: createHref({ type: 'Dashboard' }),
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
