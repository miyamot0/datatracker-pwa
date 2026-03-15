import { createFileRoute, redirect } from '@tanstack/react-router';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import ClientsPage from '../components/dashboard-participants/clients-page';
import { routeGuard } from '@/lib/routing';

export const Route = createFileRoute('/session/$group/')({
  beforeLoad: routeGuard,
  loader: ({ params }) => {
    if (!params.group) {
      throw redirect({
        href: createHref({ type: 'Dashboard' }),
      });
    }

    return {
      Group: CleanUpString(params.group),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group } = Route.useLoaderData();

  return <ClientsPage Group={Group} />;
}
