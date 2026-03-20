import { SessionDesignerPage } from '@/components/pages/editor-session/session-designer';
import createHref from '@/lib/links';
import { routeGuard } from '@/lib/routing';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/$evaluation/')({
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

  return <SessionDesignerPage Group={Group} Individual={Individual} Evaluation={Evaluation} />;
}
