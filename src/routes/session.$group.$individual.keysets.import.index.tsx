import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import ViewerKeysetPage from '../components/dashboard-keysets-import/viewer-keysets-page';
import { routeGuard } from '@/lib/routing';

export const Route = createFileRoute('/session/$group/$individual/keysets/import/')({
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

  return <ViewerKeysetPage Group={Group} Individual={Individual} />;
}
