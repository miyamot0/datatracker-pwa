import { createFileRoute, redirect } from '@tanstack/react-router';
import { CleanUpString } from '@/lib/strings';
import createHref from '@/lib/links';
import { routeGuard } from '@/lib/routing';
import KeySetsPage from '@/components/pages/dashboard-keysets/keysets-page';

export const Route = createFileRoute('/session/$group/$individual/keysets/')({
  beforeLoad: routeGuard,
  loader: ({ params }) => {
    const { group, individual } = params;

    if (!group || !individual) {
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

  return <KeySetsPage Group={Group} Individual={Individual} />;
}
