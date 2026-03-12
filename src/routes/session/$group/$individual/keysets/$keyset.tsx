import createHref from '@/lib/links';
import { CleanUpString } from '@/lib/strings';
import { createFileRoute, redirect } from '@tanstack/react-router';
import KeySetEditor from './-components/keyset-editor';

export const Route = createFileRoute('/session/$group/$individual/keysets/$keyset')({
  loader: ({ params, context }) => {
    const { group, individual, keyset } = params;
    const { routerHandle } = context;

    if (!group || !individual || !routerHandle) {
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
