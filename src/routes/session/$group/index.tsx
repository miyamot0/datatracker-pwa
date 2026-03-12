import { createFileRoute, redirect } from '@tanstack/react-router';
import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import ClientsPage from '../-components/clients-page';

export const Route = createFileRoute('/session/$group/')({
  loader: ({ params, context }) => {
    if (!params.group || !context.routerHandle.handle) {
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
