import { createRootRouteWithContext, Outlet, useRouter } from '@tanstack/react-router';

import { CustomizedRouterContext } from '@/App';
import { useContext, useEffect } from 'react';
import { FolderHandleContext } from '@/context/folder-context';
import { viewTransitionCall } from '@/types/transitions';

export const Route = createRootRouteWithContext<CustomizedRouterContext>()({
  component: () => {
    const router = useRouter();
    const { isInitialized, setIsInitialized, settings } = useContext(FolderHandleContext);

    useEffect(() => {
      if (isInitialized == false) {
        router.options.defaultViewTransition = viewTransitionCall(settings.TransitionBehavior);
        setIsInitialized(true);
      }
    }, [isInitialized]);

    return (
      <>
        <Outlet />
      </>
    );
  },
});
