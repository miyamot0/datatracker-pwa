import EvaluationsPage from '@/routes/session/$group/$individual/-components/evaluations-page';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/')({
  loader: ({ params, context }) => {
    const { group, individual } = params;
    const { routerHandle } = context;

    if (!group || !individual || !routerHandle.handle) {
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

  return <EvaluationsPage Group={Group} Individual={Individual} />;
}
