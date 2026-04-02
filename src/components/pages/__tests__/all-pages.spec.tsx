import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it } from 'vitest';
import EvaluationsPage from '../dashboard-evaluations/evaluations-page';
import PageWrapper from '@/components/elements/page-wrapper';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings/application-settings';
import { FolderHandleContext } from '@/context/folder-context';
import '@/styles/globals.css';
import HomePage from '../home/home-page';
import DocumentationListingPage from '../documentation/documentation-listing-page';
import DocumentationEntryPage from '../documentation/documentation-entry-page';
import { AllFrontMatter, AllKeywordsArray } from '@/lib/docs';
import AuthorizedDisplayContent from '../dashboard-groups/authorized-display-content';
import UnauthorizedDisplay from '../dashboard-groups/unauthorized-display';
import ClientsPage from '../dashboard-participants/clients-page';
import ViewerEvaluationsPage from '../dashboard-evaluations-import/viewer-evaluations-page';
import KeySetsPage from '../dashboard-keysets/keysets-page';
import ViewerKeysetPage from '../dashboard-keysets-import/viewer-keysets-page';
import DashboardHistoryPage from '../dashboard-outcomes/dashboard-history-page';
import ViewSyncPage from '../dashboard-sync/view-sync-page';
import KeySetEditor from '../editor-keyset/keyset-editor';
import SessionDesigner from '../editor-session/session-designer-form';
import SessionManagerContent from '../editor-session-outcome/session-manager-content';
import SessionViewerContent from '../editor-session-outcome/views/session-viewer-content';
import SettingsPage from '../editor-settings/settings-page';
import SessionRecorderPage from '../session-recorder/session-recorder-page';
import ReliabilityViewerPage from '../summary-agreement/reli-viewer-page';
import ResultsViewerContent from '../summary-outcomes/results-viewer-content';
import ResultsRateVisualsPage from '../visualize-outcomes/rate/results-rate-visuals-page';
import ResultsProportionVisualsPage from '../visualize-outcomes/proportion/results-proportion-visuals-page';
import { SessionTerminationOptions } from '@/types/terminations';
import { preparePlotDataCumulative } from '@/lib/summary';
import { combineAndSortKeyPresses } from '@/lib/schedule-parser';
import { generateTicks } from '@/lib/graphing/chart-setup';
import demandTreatmentKeysetJson from '@/assets/data/Evaluation Study/Participant 001/FC Treatment Evaluation.json';

const demandTreatmentSessionModules = {
  ...import.meta.glob(
    '/src/assets/data/Evaluation Study/Participant 001/Demand Treatment Evaluation/Baseline/*_Primary.json',
    {
      eager: true,
      import: 'default',
    },
  ),
  ...import.meta.glob(
    '/src/assets/data/Evaluation Study/Participant 001/Demand Treatment Evaluation/Intervention/*_Primary.json',
    {
      eager: true,
      import: 'default',
    },
  ),
};

const mockKeywordArray = AllKeywordsArray;

const mockFrontMatter = AllFrontMatter;

const mockEntry = {
  matter: mockFrontMatter[0],
  value: `# Getting Started\n\nWelcome to **DataTracker**. This guide walks you through the initial setup.\n\n## Step 1: Authorize a Folder\n\nClick the "Authorize Folder" button on the home screen to grant access to your data directory.\n\n## Step 2: Create a Group\n\nNavigate to the Groups page and create your first study group.`,
};

// ----- Hoisted refs -----
const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue([]));
vi.hoisted(() => {
  vi.stubEnv('VITE_MODE', 'base');
});

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

vi.mock('@/queries/evaluations/mutate-evaluations-all', () => ({
  mutationEvaluationsAll: vi.fn(),
}));

vi.mock('@/queries/keysets/mutate-keyboards', () => ({
  mutationKeyboards: vi.fn(),
}));

vi.mock('@/queries/keysets/mutate-keyboards-all', () => ({
  mutateKeyboardsAll: vi.fn(),
}));

vi.mock('@/queries/outcomes/mutate-session-outcomes', () => ({
  mutationSettingsOutcomes: vi.fn(),
}));

vi.mock('@/queries/conditions/mutate-conditions', () => ({
  mutationConditions: vi.fn(),
}));

vi.mock('@/queries/session/mutate-session-params', () => ({
  mutationSettingsParams: vi.fn(),
}));

// ----- Tests -----

// Vite build-time globals not defined in vitest
vi.stubGlobal('BUILD_VERSION', '0.5.6');
vi.stubGlobal('BUILD_DATE', '03/29/2026');

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

    await page.viewport(1295, 825);
    await page.screenshot({ path: '../../../../public/screenshots/evaluation_page.png' });
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

    await page.viewport(1295, 900);
    await page.screenshot({ path: '../../../../public/screenshots/home_page.png' });
  });
});

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

    //await page.screenshot({ path: '../../../../public/screenshots/documentation_listing_page.png' });
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
              PreviousEntry={undefined}
              NextEntry={mockFrontMatter[1]}
              Settings={DEFAULT_APPLICATION_SETTINGS}
            />
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    //await page.screenshot({ path: '../../../../public/screenshots/documentation_entry_page.png' });
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

    await page.viewport(1295, 850);
    await page.screenshot({ path: '../../../../public/screenshots/groups_authorized_page.png' });
  });
});

describe('UnauthorizedDisplay', () => {
  it('renders with full styles and saves a screenshot', async () => {
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

    await page.screenshot({ path: '../../../../public/screenshots/groups_unauthorized_page.png' });
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

    await page.screenshot({ path: '../../../../public/screenshots/clients_page.png' });
  });
});

// ----- Shared sample data -----

const mockKeyset: import('@/types/keyset').KeySet = {
  id: 'ks-001',
  Name: 'Functional Analysis',
  createdAt: new Date('2026-01-01'),
  lastModified: new Date('2026-03-01'),
  FrequencyKeys: [
    { KeyName: 'a', KeyDescription: 'Aggression', KeyCode: 65 },
    { KeyName: 's', KeyDescription: 'Self-Injury', KeyCode: 83 },
    { KeyName: 'd', KeyDescription: 'Disruption', KeyCode: 68 },
  ],
  DurationKeys: [{ KeyName: 'r', KeyDescription: 'Reinforcement', KeyCode: 90 }],
  DerivedKeys: [],
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
};

const mockSessionSettings: import('@/lib/dtos').SavedSettings = {
  Therapist: 'Dr. Smith',
  Condition: 'Baseline',
  KeySet: 'Functional Analysis',
  TimerOption: SessionTerminationOptions.TimerMain,
  Initials: 'JS',
  Role: 'Primary',
  Session: 1,
  DurationS: 600,
};

const mockSession: import('@/types/storage').ModifiedSessionResult = {
  Filename: 'session_001.json',
  Keyset: mockKeyset,
  SessionSettings: mockSessionSettings,
  SystemKeyPresses: [],
  FrequencyKeyPresses: [
    {
      KeyName: 'a',
      KeyCode: 65,
      KeyDescription: 'Aggression',
      KeyScheduleRecording: 'Primary',
      TimePressed: new Date('2026-03-29T10:01:30'),
      TimeIntoSession: 90,
      KeyType: 'Frequency',
    },
    {
      KeyName: 's',
      KeyCode: 83,
      KeyDescription: 'Self-Injury',
      KeyScheduleRecording: 'Primary',
      TimePressed: new Date('2026-03-29T10:03:00'),
      TimeIntoSession: 180,
      KeyType: 'Frequency',
    },
  ],
  DurationKeyPresses: [],
  SessionStart: '2026-03-29T10:00:00',
  SessionEnd: '2026-03-29T10:10:00',
  EndedEarly: false,
  TimerMain: 600,
  TimerOne: 0,
  TimerTwo: 0,
  TimerThree: 0,
  SpecialKeyTimers: {} as Record<string, number>,
  Comments: 'Participant was cooperative throughout.',
};

const mockTimerMapping: import('@/types/schedules').ScoringOptionsMapType = {
  value: 'End on Primary Timer',
  label: 'Score Total Time',
};

const mockShowKeys: import('@/types/visuals').ToggleDisplayKey[] = [
  { KeyName: 'a', KeyDescription: 'Aggression', KeyCode: 65, KeyType: 'Observed', Visible: true },
  { KeyName: 's', KeyDescription: 'Self-Injury', KeyCode: 83, KeyType: 'Observed', Visible: true },
];

type ImportedKeySet = Omit<import('@/types/keyset').KeySet, 'createdAt' | 'lastModified'> & {
  createdAt: string;
  lastModified: string;
};

type ImportedSessionResult = Omit<import('@/lib/dtos').SavedSessionResult, 'Keyset'> & {
  Keyset?: Partial<import('@/types/keyset').KeySet>;
  SpecialKeyTimers?: Record<string, number>;
};

function hydrateImportedKeyset(keyset: ImportedKeySet): import('@/types/keyset').KeySet {
  return {
    ...keyset,
    DerivedKeys: keyset.DerivedKeys ?? [],
    SpecialDurationKeys: keyset.SpecialDurationKeys ?? [],
    ScorableDurationKeys: keyset.ScorableDurationKeys ?? [],
    createdAt: new Date(keyset.createdAt),
    lastModified: new Date(keyset.lastModified),
  };
}

function hydrateImportedSession(
  filename: string,
  session: ImportedSessionResult,
  keyset: import('@/types/keyset').KeySet,
): import('@/types/storage').ModifiedSessionResult {
  return {
    ...session,
    Filename: filename,
    Keyset: keyset,
    SpecialKeyTimers: session.SpecialKeyTimers ?? {},
  };
}

function getSessionNumberFromPath(path: string) {
  const filename = path.split('/').pop() ?? '0';
  return Number.parseInt(filename.split('_')[0] ?? '0', 10);
}

const demandTreatmentKeyset = hydrateImportedKeyset(demandTreatmentKeysetJson as ImportedKeySet);

const demandTreatmentSessions = Object.entries(demandTreatmentSessionModules)
  .sort(([leftPath], [rightPath]) => getSessionNumberFromPath(leftPath) - getSessionNumberFromPath(rightPath))
  .map(([path, session]) => {
    const filename = path.split('/').pop() ?? 'session.json';
    return hydrateImportedSession(filename, session as ImportedSessionResult, demandTreatmentKeyset);
  });

const demandTreatmentRateShowKeys: import('@/types/visuals').ToggleDisplayKey[] = [
  ...demandTreatmentKeyset.FrequencyKeys.filter((key) =>
    ['AGG', 'DIS', 'FCR', 'Prompt'].includes(key.KeyDescription),
  ).map((key) => ({
    ...key,
    KeyType: 'Observed' as const,
    Visible: true,
  })),
  ...demandTreatmentKeyset.DerivedKeys.filter((key) => ['CTB'].includes(key.name)).map((key, index) => ({
    KeyName: key.name,
    KeyDescription: key.name,
    KeyCode: 1000 + index,
    KeyType: 'Derived' as const,
    Visible: true,
  })),
];

const demandTreatmentProportionShowKeys: import('@/types/visuals').ToggleDisplayKey[] =
  demandTreatmentKeyset.DurationKeys.filter((key) => ['SR', 'Tantrum'].includes(key.KeyDescription)).map((key) => ({
    ...key,
    KeyType: 'Observed' as const,
    Visible: true,
  }));

const demandTreatmentTimerMapping: import('@/types/schedules').ScoringOptionsMapType = {
  value: 'End on Timer #1',
  label: 'Score Timer #1 Time',
};

const demandTreatmentSessionBounds = {
  min: Math.min(...demandTreatmentSessions.map((session) => session.SessionSettings.Session)),
  max: Math.max(...demandTreatmentSessions.map((session) => session.SessionSettings.Session)),
};

const demandTreatmentSessionViewerShowKeys: import('@/types/visuals').ToggleDisplayKey[] =
  demandTreatmentKeyset.FrequencyKeys.map((key) => ({
    ...key,
    KeyType: 'Observed' as const,
    Visible: true,
  }));

const demandTreatmentSessionViewerSession =
  demandTreatmentSessions.find((session) => session.SessionSettings.Session === 13) ?? demandTreatmentSessions[0];

const demandTreatmentSessionViewerPlot = preparePlotDataCumulative(demandTreatmentSessionViewerSession);

const demandTreatmentSessionViewerYValues = demandTreatmentSessionViewerPlot
  .map((point) => {
    const keys = Object.keys(point).filter((key) => key !== 'second');
    return keys.map((key) => point[key]);
  })
  .flat();

const demandTreatmentSessionViewerMaxY = Math.max(...demandTreatmentSessionViewerYValues) + 1;

const demandTreatmentSessionViewerExpandedSession: import('@/lib/dtos').ExpandedSavedSessionResult = {
  ...demandTreatmentSessionViewerSession,
  Comments: demandTreatmentSessionViewerSession.Comments ?? 'Imported example session.',
  MaxY: demandTreatmentSessionViewerMaxY,
  YTicks: generateTicks(demandTreatmentSessionViewerMaxY, 0),
  PlottedKeys: combineAndSortKeyPresses(demandTreatmentSessionViewerSession),
};

describe('ViewerEvaluationsPage', () => {
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
              breadcrumbs={[
                { label: 'Study Trial A', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
              ]}
              label="Import Evaluations"
            >
              <ViewerEvaluationsPage
                Group="Study Trial A"
                Individual="Participant 001"
                Handle={mockHandle}
                Settings={DEFAULT_APPLICATION_SETTINGS}
                Evaluations={[
                  {
                    Group: 'Study Trial A',
                    Individual: 'Participant 002',
                    Evaluation: 'Functional Analysis',
                    Conditions: ['Baseline', 'Attention', 'Demand', 'Alone'],
                  },
                  {
                    Group: 'Study Trial A',
                    Individual: 'Participant 002',
                    Evaluation: 'Demand Treatment',
                    Conditions: ['Baseline', 'FCT Evaluation'],
                  },
                  {
                    Group: 'Study Trial B',
                    Individual: 'Participant 003',
                    Evaluation: 'Attention Treatment',
                    Conditions: ['Baseline', 'FCT Evaluation'],
                  },
                ]}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots/viewer_evaluations_page.png' });
  });
});

describe('KeySetsPage', () => {
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
              breadcrumbs={[
                { label: 'Study Trial A', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
              ]}
              label="KeySets"
            >
              <KeySetsPage
                Group="Study Trial A"
                Individual="Participant 001"
                Handle={mockHandle}
                Settings={DEFAULT_APPLICATION_SETTINGS}
                KeySets={[
                  mockKeyset,
                  {
                    ...mockKeyset,
                    id: 'ks-002',
                    Name: 'Treatment Evaluation Keyset',
                    createdAt: new Date('2026-02-01'),
                    lastModified: new Date('2026-03-15'),
                  },
                ]}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots/keysets_page.png' });
  });
});

describe('ViewerKeysetPage', () => {
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
              breadcrumbs={[
                { label: 'Study Trial A', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
              ]}
              label="Import KeySets"
            >
              <ViewerKeysetPage
                Group="Study Trial A"
                Individual="Participant 001"
                Handle={mockHandle}
                Settings={DEFAULT_APPLICATION_SETTINGS}
                Keysets={[
                  { ...mockKeyset, Group: 'Study Trial A', Individual: 'Participant 002' },
                  {
                    ...mockKeyset,
                    id: 'ks-002',
                    Name: 'Attention Keyset',
                    Group: 'Study Trial B',
                    Individual: 'Participant 003',
                    createdAt: new Date('2026-02-01'),
                    lastModified: new Date('2026-03-15'),
                  },
                ]}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots/viewer_keyset_page.png' });
  });
});

describe('DashboardHistoryPage', () => {
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
              breadcrumbs={[
                { label: 'Study Trial A', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
                { label: 'Functional Analysis', to: '/session/$group/$individual/$evaluation' },
              ]}
              label="Session History"
            >
              <DashboardHistoryPage
                Group="Study Trial A"
                Individual="Participant 001"
                Evaluation="Functional Analysis"
                Handle={mockHandle}
                Settings={DEFAULT_APPLICATION_SETTINGS}
                Sessions={[
                  mockSession,
                  {
                    ...mockSession,
                    Filename: 'session_001.json',
                    SessionSettings: {
                      ...mockSessionSettings,
                      Session: 1,
                      Condition: 'Attention',
                      Role: 'Reliability',
                    },
                    SessionEnd: '2026-03-29T11:10:00',
                    TimerMain: 600,
                  },
                  {
                    ...mockSession,
                    Filename: 'session_002.json',
                    SessionSettings: { ...mockSessionSettings, Session: 2, Condition: 'Demand' },
                    SessionEnd: '2026-03-30T10:10:00',
                    TimerMain: 600,
                  },
                ]}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots/dashboard_history_page.png' });
  });
});

describe('ViewSyncPage', () => {
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
            <PageWrapper Settings={DEFAULT_APPLICATION_SETTINGS} label="Sync">
              <ViewSyncPage Settings={DEFAULT_APPLICATION_SETTINGS} Handle={mockHandle} />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots/view_sync_page.png' });
  });
});

describe('KeySetEditor', () => {
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
              breadcrumbs={[
                { label: 'Study Trial A', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
                { label: 'KeySets', to: '/session/$group/$individual/keysets' },
              ]}
              label="Edit KeySet"
            >
              <KeySetEditor
                Group="Study Trial A"
                Individual="Participant 001"
                KeySetObject={mockKeyset}
                Handle={mockHandle}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots/keyset_editor_page.png' });
  });
});

describe('SessionDesigner', () => {
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
              breadcrumbs={[
                { label: 'Study Trial A', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
                { label: 'Functional Analysis', to: '/session/$group/$individual/$evaluation' },
              ]}
              label="Session Designer"
            >
              <SessionDesigner
                Group="Study Trial A"
                Individual="Participant 001"
                Evaluation="Functional Analysis"
                Conditions={['Baseline', 'Attention', 'Demand', 'Alone']}
                Keysets={[mockKeyset]}
                SessionSettings={mockSessionSettings}
                Settings={DEFAULT_APPLICATION_SETTINGS}
                Handle={mockHandle}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.viewport(1295, 1475);
    await page.screenshot({ path: '../../../../public/screenshots/session_designer_page.png' });
  });
});

describe('SessionManagerContent', () => {
  it('renders with full styles and saves a screenshot', async () => {
    const mockHandle = {} as FileSystemDirectoryHandle;

    const savedKeys: import('@/types/timing').KeyManageType[] = [
      ...mockSession.FrequencyKeyPresses,
      {
        KeyName: 'z',
        KeyCode: 90,
        KeyDescription: 'Escape',
        KeyScheduleRecording: 'Primary',
        TimePressed: new Date('2026-03-29T10:02:00'),
        TimeIntoSession: 120,
        KeyType: 'Duration',
      },
    ];

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
              breadcrumbs={[
                { label: 'Study Trial A', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
                { label: 'Functional Analysis', to: '/session/$group/$individual/$evaluation' },
                { label: 'History', to: '/session/$group/$individual/$evaluation/history' },
              ]}
              label="Edit Session"
            >
              <SessionManagerContent
                Group="Study Trial A"
                Individual="Participant 001"
                Evaluation="Functional Analysis"
                Session={mockSession}
                SavedKeys={savedKeys}
                Handle={mockHandle}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots/session_manager_content_page.png' });
  });
});

describe('SessionViewerContent', () => {
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
              breadcrumbs={[
                { label: 'Evaluation Study', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
                { label: 'Demand Treatment Evaluation', to: '/session/$group/$individual/$evaluation' },
                { label: 'History', to: '/session/$group/$individual/$evaluation/history' },
              ]}
              label="Session Inspector"
            >
              <SessionViewerContent
                Group="Evaluation Study"
                Individual="Participant 001"
                Evaluation="Demand Treatment Evaluation"
                ShowKeys={demandTreatmentSessionViewerShowKeys}
                ExpandedSession={demandTreatmentSessionViewerExpandedSession}
                PlotObject={demandTreatmentSessionViewerPlot}
                Settings={DEFAULT_APPLICATION_SETTINGS}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.viewport(1295, 2050);
    await page.screenshot({ path: '../../../../public/screenshots/session_viewer_content_page.png' });
  });
});

describe('SettingsPage', () => {
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
            <SettingsPage />
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.viewport(1295, 1000);
    await page.screenshot({ path: '../../../../public/screenshots/settings_page.png' });
  });
});

describe('SessionRecorderPage', () => {
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
              breadcrumbs={[
                { label: 'Study Trial A', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
                { label: 'Functional Analysis', to: '/session/$group/$individual/$evaluation' },
              ]}
              label="Session Designer"
            >
              <SessionRecorderPage
                Group="Study Trial A"
                Individual="Participant 001"
                Evaluation="Functional Analysis"
                KeySetObject={mockKeyset}
                SessionParams={mockSessionSettings}
                Handle={mockHandle}
                ApplicationSettings={DEFAULT_APPLICATION_SETTINGS}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.viewport(1295, 900);
    await page.screenshot({ path: '../../../../public/screenshots/session_recorder_page.png' });
  });
});

describe('ReliabilityViewerPage', () => {
  it('renders with full styles and saves a screenshot', async () => {
    const mockHandle = {} as FileSystemDirectoryHandle;

    const pairedSession: import('@/types/reli').ReliabilityPairType[] = [{ primary: mockSession, reli: mockSession }];

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
              breadcrumbs={[
                { label: 'Study Trial A', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
                { label: 'Functional Analysis', to: '/session/$group/$individual/$evaluation' },
                { label: 'Reliability', to: '/session/$group/$individual/$evaluation/reli' },
              ]}
              label="Reliability Viewer"
            >
              <ReliabilityViewerPage
                Group="Study Trial A"
                Individual="Participant 001"
                PairedSession={pairedSession}
                Keyset={mockKeyset}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.viewport(1295, 800);
    await page.screenshot({ path: '../../../../public/screenshots/reli_viewer_page.png' });
  });
});

describe('ResultsViewerContent', () => {
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
              breadcrumbs={[
                { label: 'Study Trial A', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
                { label: 'Functional Analysis', to: '/session/$group/$individual/$evaluation' },
                { label: 'Results', to: '/session/$group/$individual/$evaluation/outcomes' },
              ]}
              label="Session Results"
            >
              <ResultsViewerContent
                TimerMapping={mockTimerMapping}
                Results={[mockSession]}
                Keyset={mockKeyset}
                Group="Study Trial A"
                Individual="Participant 001"
                Evaluation="Functional Analysis"
                ShowKeysFreq={mockShowKeys}
                ShowKeysDuration={[]}
                Settings={DEFAULT_APPLICATION_SETTINGS}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.screenshot({ path: '../../../../public/screenshots/results_viewer_content_page.png' });
  });
});

describe('ResultsRateVisualsPage', () => {
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
              breadcrumbs={[
                { label: 'Evaluation Study', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
                { label: 'Demand Treatment Evaluation', to: '/session/$group/$individual/$evaluation' },
              ]}
              label="Rate Visualization"
            >
              <ResultsRateVisualsPage
                Group="Evaluation Study"
                Individual="Participant 001"
                Evaluation="Demand Treatment Evaluation"
                Handle={mockHandle}
                Results={demandTreatmentSessions}
                ResultsFiltered={demandTreatmentSessions}
                DynamicKeySet={demandTreatmentKeyset}
                TimerMapping={demandTreatmentTimerMapping}
                ShowKeys={demandTreatmentRateShowKeys}
                MinX={demandTreatmentSessionBounds.min}
                MaxX={demandTreatmentSessionBounds.max}
                Settings={DEFAULT_APPLICATION_SETTINGS}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.viewport(1295, 1150);
    await page.screenshot({ path: '../../../../public/screenshots/rate_visuals_page.png' });
  });
});

describe('ResultsProportionVisualsPage', () => {
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
              breadcrumbs={[
                { label: 'Evaluation Study', to: '/session/$group' },
                { label: 'Participant 001', to: '/session/$group/$individual' },
                { label: 'Demand Treatment Evaluation', to: '/session/$group/$individual/$evaluation' },
              ]}
              label="Proportion Visualization"
            >
              <ResultsProportionVisualsPage
                Group="Evaluation Study"
                Individual="Participant 001"
                Evaluation="Demand Treatment Evaluation"
                Results={demandTreatmentSessions}
                ResultsFiltered={demandTreatmentSessions}
                DynamicKeySet={demandTreatmentKeyset}
                TimerMapping={demandTreatmentTimerMapping}
                ShowKeys={demandTreatmentProportionShowKeys}
                MinX={demandTreatmentSessionBounds.min}
                MaxX={demandTreatmentSessionBounds.max}
                Settings={DEFAULT_APPLICATION_SETTINGS}
              />
            </PageWrapper>
          </TooltipProvider>
        </FolderHandleContext.Provider>
      </ThemeProvider>,
    );

    await page.viewport(1295, 1150);
    await page.screenshot({ path: '../../../../public/screenshots/proportion_visuals_page.png' });
  });
});
