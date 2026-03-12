import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import ViewerKeysetPage from './-components/viewer-keysets-page';

export const Route = createFileRoute('/session/$group/$individual/keysets/import')({
  loader: ({ params, context }) => {
    const { group, individual } = params;
    const { routerHandle } = context;

    if (!group || !individual || !routerHandle) {
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

  return <ViewerKeysetPage Group={Group} Individual={Individual} />;
}
