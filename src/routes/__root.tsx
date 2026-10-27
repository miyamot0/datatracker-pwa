import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router';

import { CustomizedRouterContext } from '@/App';
import { useContext, useEffect } from 'react';
import { FolderHandleContext } from '@/context/folder-context';
import { viewTransitionCall } from '@/types/transitions';
import { RouteErrorView } from '@/components/pages/error/route-error-view';
import { buildRouteErrorPayload } from '@/lib/route-error';

export const Route = createRootRouteWithContext<CustomizedRouterContext>()({
  errorComponent: ({ error }) => (
    <RouteErrorView payload={buildRouteErrorPayload({ cause: error })} />
  ),
  notFoundComponent: () => (
    <RouteErrorView
      payload={buildRouteErrorPayload({ message: 'This page could not be found.' })}
    />
  ),
  component: () => {
    const router = useRouter();
    const { isInitialized, setIsInitialized, settings } = useContext(FolderHandleContext);

    useEffect(() => {
      if (isInitialized == false) {
        router.options.defaultViewTransition = viewTransitionCall(settings.TransitionBehavior);
        setIsInitialized(true);
      }
    }, [isInitialized]);

    return <Outlet />;
  },
});
