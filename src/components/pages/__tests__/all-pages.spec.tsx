import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { vi, describe, it } from 'vitest';
import EvaluationsPage from '../dashboard-evaluations/evaluations-page';
import PageWrapper from '@/components/elements/page-wrapper';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import { FolderHandleContext } from '@/context/folder-context';
import '@/styles/globals.css';
import HomePage from '../home/home-page';

// ----- Hoisted refs -----
const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue([]));

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    isError: false,
  })),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    params,
    children,
    className,
  }: {
    to: string;
    params?: Record<string, string>;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a
      href={to}
      data-params={params ? JSON.stringify(params) : undefined}
      className={className}
      onClick={(e) => e.preventDefault()}
    >
      {children}
    </a>
  ),
  useRouter: () => ({ invalidate: vi.fn().mockResolvedValue(undefined) }),
  useRouterState: () => ({ matches: [{ routeId: '/test' }] }),
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/queries/evaluations/mutate-evaluations', () => ({
  mutationEvaluations: vi.fn(),
}));

// ----- Tests -----

// Vite build-time globals not defined in vitest
vi.stubGlobal('BUILD_VERSION', '0.5.6');
vi.stubGlobal('BUILD_DATE', '03/29/2026');
vi.stubGlobal('MODALITY', 'base');

describe('EvaluationsPage', () => {
  it('renders with full styles and saves a screenshot', async () => {
    const mockHandle = {} as FileSystemDirectoryHandle;

    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <FolderHandleContext.Provider
          value={{
            handle: mockHandle,
            setHandle: vi.fn(),
            settings: { ...DEFAULT_APPLICATION_SETTINGS, EnableFileDeletion: true },
            setSettings: vi.fn(),
            saveSettings: vi.fn(),
            isInitialized: true,
            setIsInitialized: vi.fn(),
          }}
        >
          <TooltipProvider>
            <PageWrapper
              Settings={{ ...DEFAULT_APPLICATION_SETTINGS, EnableFileDeletion: true }}
              breadcrumbs={[
                { label: 'Study Trial', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
              ]}
              label="Evaluations"
            >
              <EvaluationsPage
                Group="Study Trial"
                Individual="Participant 001"
                Evaluations={['Functional Analysis', 'Demand Treatment Evaluation', 'Attention Treatment Evaluation']}
                Settings={{ ...DEFAULT_APPLICATION_SETTINGS, EnableFileDeletion: true }}
                Handle={mockHandle}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots2/evaluation_page.png' });
  });
});

describe('HomePage', () => {
  it('renders with full styles and saves a screenshot', async () => {
    const mockHandle = {} as FileSystemDirectoryHandle;

    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <FolderHandleContext.Provider
          value={{
            handle: mockHandle,
            setHandle: vi.fn(),
            settings: { ...DEFAULT_APPLICATION_SETTINGS, EnableFileDeletion: true },
            setSettings: vi.fn(),
            saveSettings: vi.fn(),
            isInitialized: true,
            setIsInitialized: vi.fn(),
          }}
        >
          <TooltipProvider>
            <PageWrapper Settings={{ ...DEFAULT_APPLICATION_SETTINGS, EnableFileDeletion: true }} label="Home">
              <HomePage
                Settings={{ ...DEFAULT_APPLICATION_SETTINGS, EnableFileDeletion: true }}
                SaveSettings={() => {}}
                SetSettings={() => {}}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots2/home_page.png' });
  });
});
