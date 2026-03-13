import { FolderContextProvider, FolderHandleContextType } from './context/folder-context';
import { ThemeProvider } from './components/ui/theme-provider';
import { routeTree } from './routeTree.gen';
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routerHandle, RouterHandle } from './context/router-context';
import { useFolderHandleContext } from './context/use-folder-context';

export interface CustomizedRouterContext {
  routerHandle: RouterHandle;
  queryClient: QueryClient;
  folderHandleContext: FolderHandleContextType;
}

const hashHistory = createHashHistory();

// Set up a Router instance
const router = createRouter({
  routeTree,
  history: hashHistory,
  context: {
    queryClient: undefined!,
    routerHandle: undefined!,
    folderHandleContext: undefined!,
  },
});

// Register things for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export const queryClient = new QueryClient();

const InnerApp = () => {
  const folderHandleContext = useFolderHandleContext();

  return (
    <RouterProvider
      router={router}
      context={{
        routerHandle: routerHandle,
        queryClient: queryClient,
        folderHandleContext: folderHandleContext,
      }}
    />
  );
};

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="system">
        <FolderContextProvider>
          <QueryClientProvider client={queryClient}>
            <InnerApp />
          </QueryClientProvider>
        </FolderContextProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
