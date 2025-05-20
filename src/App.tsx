import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import HomePage from './components/pages/home/home-page';
import { FolderContextProvider, FolderHandleContext, FolderHandleContextType } from './context/folder-context';
import { ThemeProvider } from './components/ui/theme-provider';
import SettingsPage from './components/pages/editor-settings/settings-page';
import DocumentationListingPage from './components/pages/viewer-documentation-list/documentation-listing-page';
import DocumentationEntryPage from './components/pages/viewer-documentation-entry/documentation-entry-page';
import DashboardPage from './components/pages/dashboard-group/dashboard-page';
import ClientsPage, { clientsPageLoader } from './components/pages/dashboard-clients/clients-page';
import EvaluationsPage, { evaluationsPageLoader } from './components/pages/dashboard-evaluations/evaluations-page';
import KeySetsPage, { keysetsPageLoader } from './components/pages/dashboard-keysets/keysets-page';
import KeySetEditor, { keysetEditorPageLoader } from './components/pages/editor-keysets/keyset-editor';
import { sessionDesignerPageLoader, SessionDesignerPage } from './components/pages/editor-session/session-designer';
import ResultsViewerPage, { resultsViewerLoader } from './components/pages/viewer-results/results-viewer-page';
import ResultsRateVisualsPage, { resultsViewerRate } from './components/pages/viewer-visuals/results-rate-visuals-page';
import ReliabilityViewerPage, { reliViewerLoader } from './components/pages/viewer-agreement/reli-viewer-page';
import { SessionRecorderPageShim } from './components/pages/session-recorder/session-recorder-page';
import ViewerKeysetPage from './components/pages/viewer-keysets/viewer-keysets-page';
import ViewerEvaluationsPage, {
  evaluationImportPageLoader,
} from './components/pages/viewer-evaluations/viewer-evaluations-page';
import ViewSyncPage from './components/pages/viewer-sync-queue/view-sync-page';
import { useContext, useMemo } from 'react';
import DashboardHistoryPage, {
  sessionHistoryLoader,
} from './components/pages/dashboard-history/dashboard-history-page';
import SessionViewerPage, { sessionViewerLoader } from './components/pages/viewer-session/session-viewer-page';
import ResultsProportionVisualsPage, {
  resultsViewerProportion,
} from './components/pages/viewer-visuals/results-proportion-visuals-page';

const AppRoot = () => {
  const dataContext = useContext(FolderHandleContext) as unknown as FolderHandleContextType;

  const router = useMemo(
    () =>
      createBrowserRouter(
        createRoutesFromElements(
          <Route path="/">
            <Route index element={<HomePage />} />

            <Route path="/session/:Group/:Individual/:Evaluation/run" element={<SessionRecorderPageShim />} />

            {/* These updated w/ loaders */}
            <Route path="/dashboard">
              <Route index element={<DashboardPage />} />
              <Route path="sync" element={<ViewSyncPage />} />
            </Route>
            <Route path="/documentation">
              <Route index element={<DocumentationListingPage />} />
              <Route path=":slug" element={<DocumentationEntryPage />} />
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
                    <Route path="view" element={<ResultsViewerPage />} loader={resultsViewerLoader(dataContext)} />
                    <Route path="history">
                      <Route index element={<DashboardHistoryPage />} loader={sessionHistoryLoader(dataContext)} />
                      <Route path=":Index" element={<SessionViewerPage />} loader={sessionViewerLoader(dataContext)} />
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
          </Route>
        )
      ),
    [dataContext]
  );

  return <RouterProvider future={{ v7_startTransition: true }} router={router} />;
};

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="system">
        <FolderContextProvider>
          <AppRoot />
        </FolderContextProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
