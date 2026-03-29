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
import DocumentationListingPage from '../documentation/documentation-listing-page';
import DocumentationEntryPage from '../documentation/documentation-entry-page';
import { AllFrontMatter, AllKeywordsArray } from '@/lib/docs';
import AuthorizedDisplayContent from '../dashboard-groups/authorized-display-content';
import UnauthorizedDisplay from '../dashboard-groups/unauthorized-display';
import ClientsPage from '../dashboard-participants/clients-page';

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
  useQueryClient: vi.fn(() => ({
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
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

vi.mock('@/queries/groups/mutate-groups', () => ({
  mutationGroups: vi.fn(),
}));

vi.mock('@/queries/individuals/mutate-individuals', () => ({
  mutationIndividuals: vi.fn(),
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

const mockKeywordArray = AllKeywordsArray;

const mockFrontMatter = AllFrontMatter;

const mockEntry = {
  matter: mockFrontMatter[0],
  value: `# Getting Started\n\nWelcome to **DataTracker**. This guide walks you through the initial setup.\n\n## Step 1: Authorize a Folder\n\nClick the "Authorize Folder" button on the home screen to grant access to your data directory.\n\n## Step 2: Create a Group\n\nNavigate to the Groups page and create your first study group.`,
};

describe('DocumentationListingPage', () => {
  it('renders with full styles and saves a screenshot', async () => {
    const mockHandle = {} as FileSystemDirectoryHandle;

    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <FolderHandleContext.Provider
          value={{
            handle: mockHandle,
            setHandle: vi.fn(),
            settings: DEFAULT_APPLICATION_SETTINGS,
            setSettings: vi.fn(),
            saveSettings: vi.fn(),
            isInitialized: true,
            setIsInitialized: vi.fn(),
          }}
        >
          <TooltipProvider>
            <PageWrapper
              Settings={DEFAULT_APPLICATION_SETTINGS}
              breadcrumbs={[{ label: 'Documentation', to: '/documentation' }]}
              label="Documentation"
            >
              <DocumentationListingPage FrontMatter={mockFrontMatter} KeywordArray={mockKeywordArray} />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots2/documentation_listing_page.png' });
  });
});

describe('DocumentationEntryPage', () => {
  it('renders with full styles and saves a screenshot', async () => {
    const mockHandle = {} as FileSystemDirectoryHandle;

    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <FolderHandleContext.Provider
          value={{
            handle: mockHandle,
            setHandle: vi.fn(),
            settings: DEFAULT_APPLICATION_SETTINGS,
            setSettings: vi.fn(),
            saveSettings: vi.fn(),
            isInitialized: true,
            setIsInitialized: vi.fn(),
          }}
        >
          <TooltipProvider>
            <DocumentationEntryPage
              Entry={mockEntry}
              KeywordArray={mockKeywordArray}
              PreviousEntry={null}
              NextEntry={mockFrontMatter[1]}
              Settings={DEFAULT_APPLICATION_SETTINGS}
            />
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots2/documentation_entry_page.png' });
  });
});

describe('AuthorizedDisplayContent', () => {
  it('renders with full styles and saves a screenshot', async () => {
    const mockHandle = {} as FileSystemDirectoryHandle;

    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <FolderHandleContext.Provider
          value={{
            handle: mockHandle,
            setHandle: vi.fn(),
            settings: DEFAULT_APPLICATION_SETTINGS,
            setSettings: vi.fn(),
            saveSettings: vi.fn(),
            isInitialized: true,
            setIsInitialized: vi.fn(),
          }}
        >
          <TooltipProvider>
            <PageWrapper
              Settings={DEFAULT_APPLICATION_SETTINGS}
              breadcrumbs={[{ label: 'Groups', to: '/session' }]}
              label="Groups"
            >
              <AuthorizedDisplayContent
                Groups={['Study Trial A', 'Study Trial B', 'Clinical Pilot 2026']}
                Settings={DEFAULT_APPLICATION_SETTINGS}
                Handle={mockHandle}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots2/groups_authorized_page.png' });
  });
});

describe('UnauthorizedDisplay', () => {
  it('renders with full styles and saves a screenshot', async () => {
    const mockHandle = undefined as unknown as FileSystemDirectoryHandle;

    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <FolderHandleContext.Provider
          value={{
            handle: undefined,
            setHandle: vi.fn(),
            settings: DEFAULT_APPLICATION_SETTINGS,
            setSettings: vi.fn(),
            saveSettings: vi.fn(),
            isInitialized: false,
            setIsInitialized: vi.fn(),
          }}
        >
          <TooltipProvider>
            <PageWrapper Settings={DEFAULT_APPLICATION_SETTINGS} label="Authorize">
              <UnauthorizedDisplay />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots2/groups_unauthorized_page.png' });
  });
});

describe('ClientsPage', () => {
  it('renders with full styles and saves a screenshot', async () => {
    const mockHandle = {} as FileSystemDirectoryHandle;

    render(
      <ThemeProvider defaultTheme="light" storageKey="test-theme">
        <FolderHandleContext.Provider
          value={{
            handle: mockHandle,
            setHandle: vi.fn(),
            settings: DEFAULT_APPLICATION_SETTINGS,
            setSettings: vi.fn(),
            saveSettings: vi.fn(),
            isInitialized: true,
            setIsInitialized: vi.fn(),
          }}
        >
          <TooltipProvider>
            <PageWrapper
              Settings={DEFAULT_APPLICATION_SETTINGS}
              breadcrumbs={[{ label: 'Study Trial A', to: '/session/$group' }]}
              label="Clients"
            >
              <ClientsPage
                Group="Study Trial A"
                Clients={['Participant 001', 'Participant 002', 'Participant 003']}
                Handle={mockHandle}
                Settings={DEFAULT_APPLICATION_SETTINGS}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots2/clients_page.png' });
  });
});
