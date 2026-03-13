import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { SessionDesignerPage } from './-components/session-designer/session-designer';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/')({
  loader: ({ params, context }) => {
    const { group, individual, evaluation } = params;
    const { routerHandle } = context;

    if (!group || !individual || !evaluation || !routerHandle.handle) {
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
  return <SessionDesignerPage Group={Group} Individual={Individual} Evaluation={Evaluation} />;
}
