import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import SessionRecorderPage from '../components/session-recorder/session-recorder-page';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/run/$keyset')({
  loader: ({ params, context }) => {
    const { group, individual, evaluation, keyset } = params;
    const { routerHandle } = context;

    if (!group || !individual || !evaluation || !keyset || !routerHandle.handle) {
      throw redirect({
        href: createHref({ type: 'Dashboard' }),
      });
    }

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      Evaluation: CleanUpString(evaluation),
      Keyset: CleanUpString(keyset),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, Evaluation, Keyset } = Route.useLoaderData();

  return <SessionRecorderPage Group={Group} Individual={Individual} Evaluation={Evaluation} KeySet={Keyset} />;
}
