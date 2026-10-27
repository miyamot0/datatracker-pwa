import { createFileRoute } from '@tanstack/react-router';
import { RouteErrorView } from '@/components/pages/error/route-error-view';
import { normalizeRouteErrorSearch } from '@/lib/route-error';

export const Route = createFileRoute('/error')({
  validateSearch: normalizeRouteErrorSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const payload = Route.useSearch();

  return <RouteErrorView payload={payload} />;
}
