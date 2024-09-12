import { createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom';
import HomePage from './components/pages/home/home-page';
import { FolderContextProvider } from './context/folder-context';
import { ThemeProvider } from './components/ui/theme-provider';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/">
      <Route index element={<HomePage />} />
    </Route>
  )
);

function App({}) {
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
