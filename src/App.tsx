import { FolderContextProvider } from './context/folder-context';
import { ThemeProvider } from './components/ui/theme-provider';
import { routeTree } from './routeTree.gen';
import { RouterProvider, createHashHistory, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routerHandle, RouterHandle } from './context/router-context';

/*

const AppRoot = () => {
  const dataContext = useContext(FolderHandleContext) as unknown as FolderHandleContextType;

  const router = useMemo(
    () =>
      createHashRouter(
        createRoutesFromElements(
          <Route path="/">
            <Route index element={<HomePage />} />
            <Route path="/dashboard">
              <Route index element={<DashboardPage />} loader={groupsPageLoader(dataContext)} />
              <Route path="sync" element={<ViewSyncPage />} loader={syncPageLoader(dataContext)} />
            </Route>
            <Route path="/documentation">
              <Route
                index
                element={<DocumentationListingPage />}
                loader={documentationListingPageLoader(dataContext)}
              />
              <Route
                path=":slug"
                element={<DocumentationEntryPage />}
                loader={documentationEntryPageLoader(dataContext)}
              />
            </Route>
            <Route path="/session">
              <Route path=":Group">
                <Route index element={<ClientsPage />} loader={clientsPageLoader(dataContext)} />
                <Route path=":Individual">
                  <Route index element={<EvaluationsPage />} loader={evaluationsPageLoader(dataContext)} />
                  <Route
                    path="import"
                    element={<ViewerEvaluationsPage />}
                    loader={evaluationImportPageLoader(dataContext)}
                  />
                  <Route path="keysets">
                    <Route index element={<KeySetsPage />} loader={keysetsPageLoader(dataContext)} />
                    <Route path="import" element={<ViewerKeysetPage />} loader={keysetsPageLoader(dataContext)} />
                    <Route path=":KeySet" element={<KeySetEditor />} loader={keysetEditorPageLoader(dataContext)} />
                  </Route>
                  <Route path=":Evaluation">
                    <Route index element={<SessionDesignerPage />} loader={sessionDesignerPageLoader(dataContext)} />
                    <Route
                      path="run/:KeySet"
                      element={<SessionRecorderPage />}
                      loader={sessionRecorderPageLoader(dataContext)}
                    />
                    <Route path="view" element={<ResultsViewerPage />} loader={resultsViewerLoader(dataContext)} />
                    <Route path="history">
                      <Route index element={<DashboardHistoryPage />} loader={sessionHistoryLoader(dataContext)} />
                      <Route path=":Index" element={<SessionViewerPage />} loader={sessionViewerLoader(dataContext)} />
                      <Route
                        path="edit/:Index"
                        element={<SessionManagerPage />}
                        loader={sessionManagerLoader(dataContext)}
                      />
                    </Route>
                    <Route
                      path="proportion"
                      element={<ResultsProportionVisualsPage />}
                      loader={resultsViewerProportion(dataContext)}
                    />
                    <Route path="rate" element={<ResultsRateVisualsPage />} loader={resultsViewerRate(dataContext)} />
                    <Route path="reli" element={<ReliabilityViewerPage />} loader={reliViewerLoader(dataContext)} />
                  </Route>
                </Route>
              </Route>
            </Route>
            <Route path="/settings">
              <Route index element={<SettingsPage />} />
            </Route>
          </Route>,
        ),
      ),
    [dataContext],
  );

  return <RouterProvider future={{ v7_startTransition: true }} router={router} />;
};

*/

export interface CustomizedRouterContext {
  routerHandle: RouterHandle;
  //settings: ApplicationSettingsTypes;
  queryClient: QueryClient;
  //ctx: FolderHandleContextType;
}

const hashHistory = createHashHistory();

// Set up a Router instance
const router = createRouter({
  routeTree,
  history: hashHistory,
  context: {
    queryClient: undefined!,
    routerHandle: undefined!,
    //settings: undefined!,
    //ctx: undefined!,
  },
});

// Register things for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export const queryClient = new QueryClient();

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="system">
        <FolderContextProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider
              router={router}
              context={{
                routerHandle: routerHandle,
                queryClient: queryClient,
              }}
            />
            {
              //<AppRoot />
            }
          </QueryClientProvider>
        </FolderContextProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
