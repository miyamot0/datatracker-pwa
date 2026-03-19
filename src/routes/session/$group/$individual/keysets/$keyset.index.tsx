import KeySetEditor from '@/components/pages/editor-keyset/keyset-editor';
import createHref from '@/lib/links';
import { routeGuard } from '@/lib/routing';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/session/$group/$individual/keysets/$keyset/')({
  beforeLoad: routeGuard,
  loader: ({ params }) => {
    const { group, individual, keyset } = params;

    if (!group || !individual || !keyset) {
      throw redirect({
        href: createHref({ type: 'Dashboard' }),
      });
    }

    return {
      Group: CleanUpString(group),
      Individual: CleanUpString(individual),
      KeySet: CleanUpString(keyset),
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { Group, Individual, KeySet } = Route.useLoaderData();

  return <KeySetEditor Group={Group} Individual={Individual} KeySet={KeySet} />;
}
