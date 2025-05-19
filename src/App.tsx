import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import HomePage from './components/pages/home/home-page';
import { FolderContextProvider, FolderHandleContext, FolderHandleContextType } from './context/folder-context';
import { ThemeProvider } from './components/ui/theme-provider';
import SettingsPage from './components/pages/editor-settings/settings-page';
import DocumentationListingPage from './components/pages/viewer-documentation-list/documentation-listing-page';
import DocumentationEntryPage from './components/pages/viewer-documentation-entry/documentation-entry-page';
import DashboardPage from './components/pages/dashboard-group/dashboard-page';
import ClientsPage from './components/pages/dashboard-clients/clients-page';
import EvaluationsPage from './components/pages/dashboard-evaluations/evaluations-page';
import KeySetsPage from './components/pages/dashboard-keysets/keysets-page';
import KeySetEditor from './components/pages/editor-keysets/keyset-editor';
import { SessionDesignerShim } from './components/pages/editor-session/session-designer';
import { SessionViewerPageShim } from './components/pages/viewer-session/session-viewer-page';
import { ResultsViewerPageShim } from './components/pages/viewer-results/results-viewer-page';
import { ResultsRateVisualsPageShim } from './components/pages/viewer-visuals/results-rate-visuals-page';
import { ResultsProportionVisualsPageShim } from './components/pages/viewer-visuals/results-proportion-visuals-page';
import { ReliabilityViewerPageShim } from './components/pages/viewer-agreement/reli-viewer-page';
import { SessionRecorderPageShim } from './components/pages/session-recorder/session-recorder-page';
import ViewerKeysetPage from './components/pages/viewer-keysets/viewer-keysets-page';
import ViewerEvaluationsPage from './components/pages/viewer-evaluations/viewer-evaluations-page';
import ViewSyncPage from './components/pages/viewer-sync-queue/view-sync-page';
import { useContext, useMemo } from 'react';
import DashboardHistoryPage, {
  sessionHistoryLoader,
} from './components/pages/dashboard-history/dashboard-history-page';

const AppRoot = () => {
  const dataContext = useContext(FolderHandleContext) as unknown as FolderHandleContextType;

  const router = useMemo(
    () =>
      createBrowserRouter(
        createRoutesFromElements(
          <Route path="/">
            <Route index element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/sync" element={<ViewSyncPage />} />

            <Route path="/documentation" element={<DocumentationListingPage />} />
            <Route path="/documentation/:slug" element={<DocumentationEntryPage />} />

            <Route path="/session/:Group" element={<ClientsPage />} />
            <Route path="/session/:Group/:Individual" element={<EvaluationsPage />} />
            <Route path="/session/:Group/:Individual/keysets" element={<KeySetsPage />} />
            <Route path="/session/:Group/:Individual/keysets/import" element={<ViewerKeysetPage />} />
            <Route path="/session/:Group/:Individual/keysets/:KeySet" element={<KeySetEditor />} />
            <Route path="/session/:Group/:Individual/import" element={<ViewerEvaluationsPage />} />
            <Route path="/session/:Group/:Individual/:Evaluation" element={<SessionDesignerShim />} />
            <Route
              path="/session/:Group/:Individual/:Evaluation/history"
              element={<DashboardHistoryPage />}
              loader={sessionHistoryLoader(dataContext)}
            />
            <Route path="/session/:Group/:Individual/:Evaluation/history/:Index" element={<SessionViewerPageShim />} />
            <Route
              path="/session/:Group/:Individual/:Evaluation/proportion"
              element={<ResultsProportionVisualsPageShim />}
            />
            <Route path="/session/:Group/:Individual/:Evaluation/rate" element={<ResultsRateVisualsPageShim />} />
            <Route path="/session/:Group/:Individual/:Evaluation/reli" element={<ReliabilityViewerPageShim />} />
            <Route path="/session/:Group/:Individual/:Evaluation/run" element={<SessionRecorderPageShim />} />
            <Route path="/session/:Group/:Individual/:Evaluation/view" element={<ResultsViewerPageShim />} />

            <Route path="/settings" element={<SettingsPage />} />
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
