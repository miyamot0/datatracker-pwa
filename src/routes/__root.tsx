import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

import { CustomizedRouterContext } from '@/App';

export const Route = createRootRouteWithContext<CustomizedRouterContext>()({
  component: () => <Outlet />,
});
