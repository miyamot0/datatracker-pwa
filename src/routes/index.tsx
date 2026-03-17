import HomePage from '@/components/pages/home/home-page';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <HomePage />;
}
