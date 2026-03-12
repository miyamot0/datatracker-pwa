import { createFileRoute } from '@tanstack/react-router';
import HomePage from '@/components/pages/home/home-page';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <HomePage />;
}
