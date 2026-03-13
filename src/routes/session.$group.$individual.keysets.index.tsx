import { createFileRoute, redirect } from '@tanstack/react-router';
import KeySetsPage from '../components/dashboard-keysets/keysets-page';
import { CleanUpString } from '@/lib/strings';
import createHref from '@/lib/links';

export const Route = createFileRoute('/session/$group/$individual/keysets/')({
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

  return <KeySetsPage Group={Group} Individual={Individual} />;
}
