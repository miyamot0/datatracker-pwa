import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import DashboardHistoryPage from '../dashboard-history-page';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import { ModifiedSessionResult } from '@/types/storage';

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
    <a href={to} data-params={params ? JSON.stringify(params) : undefined} className={className}>
      {children}
    </a>
  ),
  useRouter: () => ({ invalidate: vi.fn().mockResolvedValue(undefined) }),
  useRouterState: () => ({ matches: [{ routeId: '/test' }] }),
}));

vi.mock('sonner', () => ({
  toast: {
    promise: vi.fn(async (fn: () => Promise<unknown>) => {
      await fn();
    }),
  },
}));

vi.mock('@/queries/outcomes/mutate-session-outcomes', () => ({
  mutationSettingsOutcomes: vi.fn(),
}));

vi.mock('@/lib/writer', () => ({
  GenerateSavedFileName: vi.fn(() => 'session_file.json'),
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({
    data,
    columns,
    callback,
    callback2,
    customCheckboxButton2,
  }: {
    data: ModifiedSessionResult[];
    columns: Array<{ accessorKey?: string; cell?: (ctx: unknown) => React.ReactNode }>;
    callback: (rows: ModifiedSessionResult[]) => void;
    callback2?: (rows: ModifiedSessionResult[]) => void;
    customCheckboxButton2?: React.ReactNode;
    settings?: unknown;
    filterCol?: string;
  }) => (
    <div>
      {data.map((row, i) => (
        <div key={i} data-testid="table-row">
          {columns.map((col, ci) => {
            if (col.cell) {
              return <React.Fragment key={ci}>{col.cell({ row: { original: row } })}</React.Fragment>;
            }
            return col.accessorKey ? (
              <span key={ci}>{String((row as unknown as Record<string, unknown>)[col.accessorKey] ?? '')}</span>
            ) : null;
          })}
        </div>
      ))}
      <button data-testid="delete-trigger" onClick={() => callback(data)}>
        Delete Selected
      </button>
      {callback2 && (
        <button data-testid="rename-trigger" onClick={() => callback2(data)}>
          {customCheckboxButton2}
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

// ----- Helpers -----

const makeHandle = (name: string) => ({ name }) as FileSystemDirectoryHandle;

const makeSession = (overrides: Partial<ModifiedSessionResult> = {}): ModifiedSessionResult =>
  ({
    SessionSettings: {
      Session: 1,
      Condition: 'Baseline',
      Role: 'Primary',
      Initials: 'JD',
      TimerOption: 'End on Timer #1',
      DurationS: 600,
      KeySet: '',
      Therapist: '',
    },
    TimerMain: 120.5,
    SessionEnd: new Date('2026-01-15').toISOString(),
    SessionStart: new Date('2026-01-15').toISOString(),
    EndedEarly: false,
    TimerOne: 0,
    TimerTwo: 0,
    TimerThree: 0,
    Keyset: {} as never,
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    SpecialKeyTimers: {},
    Filename: 'session_file',
    ...overrides,
  }) as ModifiedSessionResult;

const primarySession = makeSession();
const reliabilitySession = makeSession({
  SessionSettings: {
    Session: 2,
    Condition: 'Intervention',
    Role: 'Reliability',
    Initials: 'KS',
    TimerOption: 'End on Timer #1',
    DurationS: 600,
    KeySet: '',
    Therapist: '',
  },
  TimerMain: 90.0,
  SessionEnd: new Date('2026-02-20').toISOString(),
});

const defaultProps = {
  Group: 'GroupA',
  Individual: 'ClientB',
  Evaluation: 'EvalOne',
  Sessions: [primarySession, reliabilitySession],
  Settings: { ...DEFAULT_APPLICATION_SETTINGS, EnableFileDeletion: false },
  Handle: makeHandle('root'),
};

const propsWithDeletion = {
  ...defaultProps,
  Settings: { ...DEFAULT_APPLICATION_SETTINGS, EnableFileDeletion: true },
};

// ----- Tests -----

describe('DashboardHistoryPage', () => {
  let promptSpy: ReturnType<typeof vi.spyOn>;
  let confirmSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    mockMutateAsync.mockClear();
    mockMutateAsync.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Card layout ----

  describe('card layout', () => {
    it('shows the evaluation name in the card title', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      expect(screen.getByText('Session History (EvalOne)')).not.toBeNull();
    });

    it('shows the card description', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      expect(screen.getByText('Select Individual Sessions to View More')).not.toBeNull();
    });

    it('renders the BackButton', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
    });

    it('renders the informational paragraph', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      expect(screen.getByText(/summary of the data currently saved/i)).not.toBeNull();
    });
  });

  // ---- Session table ----

  describe('session table', () => {
    it('renders a row for each session', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      expect(screen.getAllByTestId('table-row')).toHaveLength(2);
    });

    it('renders an empty table when no sessions are provided', () => {
      render(<DashboardHistoryPage {...defaultProps} Sessions={[]} />);
      expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
    });

    it('renders the session number from each row', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      expect(screen.getByText('1')).not.toBeNull();
      expect(screen.getByText('2')).not.toBeNull();
    });

    it('renders the Primary role badge text', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      expect(screen.getByText('Primary')).not.toBeNull();
    });

    it('renders the Reliability role badge text', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      expect(screen.getByText('Reliability')).not.toBeNull();
    });

    it('renders TimerMain formatted to 2 decimal places', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      expect(screen.getByText('120.50')).not.toBeNull();
    });

    it('renders SessionEnd as a localized date string', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      const expectedDate = new Date(primarySession.SessionEnd).toLocaleDateString();
      expect(screen.getAllByText(expectedDate).length).toBeGreaterThan(0);
    });
  });

  // ---- Row action buttons ----

  describe('row action buttons', () => {
    it('renders a View button for each session', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      expect(screen.getAllByRole('button', { name: /view/i })).toHaveLength(2);
    });

    it('View link navigates to the history view route', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      const viewLinks = screen.getAllByRole('link', { name: /view/i });
      expect(viewLinks[0].getAttribute('href')).toBe('/session/$group/$individual/$evaluation/history/view/$file');
    });

    it('View link includes correct group, individual, and evaluation params', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      const viewLinks = screen.getAllByRole('link', { name: /view/i });
      const params = JSON.parse(viewLinks[0].getAttribute('data-params') ?? '{}');
      expect(params).toMatchObject({ group: 'GroupA', individual: 'ClientB', evaluation: 'EvalOne' });
    });

    it('View link file param strips the .json extension', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      const viewLinks = screen.getAllByRole('link', { name: /view/i });
      const params = JSON.parse(viewLinks[0].getAttribute('data-params') ?? '{}');
      expect(params.file).toBe('session_file');
    });

    it('does not render Edit buttons when EnableFileDeletion is false', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      expect(screen.queryAllByRole('button', { name: /edit/i })).toHaveLength(0);
    });

    it('renders an Edit button for each session when EnableFileDeletion is true', () => {
      render(<DashboardHistoryPage {...propsWithDeletion} />);
      expect(screen.getAllByRole('button', { name: /edit/i })).toHaveLength(2);
    });

    it('Edit link navigates to the history edit route', () => {
      render(<DashboardHistoryPage {...propsWithDeletion} />);
      const editLinks = screen.getAllByRole('link', { name: /edit/i });
      expect(editLinks[0].getAttribute('href')).toBe('/session/$group/$individual/$evaluation/history/edit/$file');
    });
  });

  // ---- Delete sessions ----

  describe('delete sessions', () => {
    it('shows a confirmation dialog when delete is triggered', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('2 sessions'));
    });

    it('does not call mutateAsync when delete is cancelled', async () => {
      confirmSpy.mockReturnValue(false);
      render(<DashboardHistoryPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('calls mutateAsync with Delete action when confirmed', async () => {
      confirmSpy.mockReturnValue(true);
      render(<DashboardHistoryPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individual: 'ClientB',
            Evaluation: 'EvalOne',
            Action: 'Delete',
          }),
        );
      });
    });
  });

  // ---- Rename condition ----

  describe('rename condition', () => {
    it('renders the "Rename Conditions" trigger button', () => {
      render(<DashboardHistoryPage {...defaultProps} />);
      expect(screen.getByTestId('rename-trigger')).not.toBeNull();
    });

    it('does nothing when rename prompt is cancelled (null)', async () => {
      promptSpy.mockReturnValue(null);
      render(<DashboardHistoryPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('rename-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('does nothing when rename prompt result is too short (less than 3 chars)', async () => {
      promptSpy.mockReturnValue('ab');
      render(<DashboardHistoryPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('rename-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('calls mutateAsync with EditCondition action for a valid new condition name', async () => {
      promptSpy.mockReturnValue('NewCondition');
      render(<DashboardHistoryPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('rename-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individual: 'ClientB',
            Evaluation: 'EvalOne',
            Action: 'EditCondition',
            ConditionRename: 'NewCondition',
          }),
        );
      });
    });
  });
});
