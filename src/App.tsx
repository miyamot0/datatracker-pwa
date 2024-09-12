import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import HomePage from './components/pages/home/home-page';
import { FolderContextProvider } from './context/folder-context';
import { ThemeProvider } from './components/ui/theme-provider';
import SettingsPage from './components/pages/editor-settings/settings-page';
import DocumentationListingPage from './components/pages/viewer-documentation-list/documentation-listing-page';
import DocumentationEntryPage from './components/pages/viewer-documentation-entry/documentation-entry-page';
import DashboardPage from './components/pages/dashboard-group/dashboard-page';
import ClientsPage from './components/pages/dashboard-individuals/clients-page';
import EvaluationsPage from './components/pages/dashboard-evaluations/evaluations-page';
import KeySetsPage from './components/pages/dashboard-keysets/keysets-page';
import KeySetEditor from './components/pages/editor-keysets/keyset-editor';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route index element={<HomePage />} />
      <Route path="documentation">
        <Route index element={<DocumentationListingPage />} />
        <Route path=":slug" element={<DocumentationEntryPage />} />
      </Route>
      <Route path="settings" element={<SettingsPage />} />
      <Route path="dashboard" element={<DashboardPage />} />
      <Route path="session">
        <Route path=":Group">
          <Route index element={<ClientsPage />} />
          <Route path=":Individual">
            <Route index element={<EvaluationsPage />} />
            {
              // TODO: Evaluation page
            }
            <Route path=":Evaluation" element={<EvaluationsPage />} />
            <Route path="keysets">
              <Route index element={<KeySetsPage />} />
              <Route path=":KeySet" element={<KeySetEditor />} />
            </Route>
          </Route>
        </Route>
      </Route>
    </Route>
  )
);

function App() {
  return (
    <>
      <ThemeProvider defaultTheme="system">
        <FolderContextProvider>
          <RouterProvider router={router} />
        </FolderContextProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
