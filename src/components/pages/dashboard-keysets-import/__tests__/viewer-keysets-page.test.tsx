import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ViewerKeysetPage from '../viewer-keysets-page';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import { KeySetExtended } from '@/types/keyset';

// ----- Hoisted refs -----
const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

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

vi.mock('@/queries/keysets/mutate-keyboards-all', () => ({
  mutateKeyboardsAll: vi.fn(),
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({
    data,
    columns,
    callback,
    customCheckboxButton,
  }: {
    data: Array<Record<string, unknown>>;
    columns: Array<{ accessorKey?: string; cell?: (ctx: unknown) => React.ReactNode }>;
    callback: (rows: Array<Record<string, unknown>>) => void;
    customCheckboxButton?: React.ReactNode;
    settings?: unknown;
    filterCol?: string;
    forceShowCheckbox?: boolean;
  }) => (
    <div>
      {data.map((row, i) => (
        <div key={i} data-testid="table-row">
          {columns.map((col, ci) => {
            if (col.cell) {
              return <React.Fragment key={ci}>{col.cell({ row: { original: row } })}</React.Fragment>;
            }
            return col.accessorKey ? <span key={ci}>{String(row[col.accessorKey] ?? '')}</span> : null;
          })}
        </div>
      ))}
      <button data-testid="import-trigger" onClick={() => callback(data)}>
        {customCheckboxButton}
      </button>
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

const makeKeyset = (name: string, group: string, individual: string): KeySetExtended =>
  ({
    id: `id-${name}`,
    Name: name,
    Group: group,
    Individual: individual,
    FrequencyKeys: [{ KeyName: 'a', KeyDescription: 'Hitting', KeyCode: 65 }],
    DurationKeys: [{ KeyName: 'b', KeyDescription: 'Running', KeyCode: 66 }],
    createdAt: new Date('2026-01-01'),
    lastModified: new Date('2026-01-01'),
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
  }) as KeySetExtended;

const sampleKeysets: KeySetExtended[] = [
  makeKeyset('BehaviorSet1', 'GroupX', 'ClientY'),
  makeKeyset('BehaviorSet2', 'GroupZ', 'ClientW'),
];

const defaultProps = {
  Group: 'GroupA',
  Individual: 'ClientB',
  Handle: makeHandle('root'),
  Keysets: sampleKeysets,
  Settings: { ...DEFAULT_APPLICATION_SETTINGS },
};

// ----- Tests -----

describe('ViewerKeysetPage', () => {
  beforeEach(() => {
    mockMutateAsync.mockClear();
    mockMutateAsync.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Card layout ----

  describe('card layout', () => {
    it('renders the card title', () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      expect(screen.getByText('Keyset Import')).not.toBeNull();
    });

    it('renders the card description', () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      expect(screen.getByText('Import a keyset file to use in your evaluations.')).not.toBeNull();
    });

    it('renders the BackButton', () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
    });

    it('renders the informational paragraph', () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      expect(screen.getByText(/This page lists keysets/i)).not.toBeNull();
    });
  });

  // ---- Keyset table ----

  describe('keyset table', () => {
    it('renders a row for each keyset', () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      expect(screen.getAllByTestId('table-row')).toHaveLength(2);
    });

    it('renders an empty table when no keysets are provided', () => {
      render(<ViewerKeysetPage {...defaultProps} Keysets={[]} />);
      expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
    });

    it('renders the Group column value', () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      expect(screen.getByText('GroupX')).not.toBeNull();
      expect(screen.getByText('GroupZ')).not.toBeNull();
    });

    it('renders the Individual column value', () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      expect(screen.getByText('ClientY')).not.toBeNull();
      expect(screen.getByText('ClientW')).not.toBeNull();
    });

    it('renders the Name column value', () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      expect(screen.getByText('BehaviorSet1')).not.toBeNull();
      expect(screen.getByText('BehaviorSet2')).not.toBeNull();
    });

    it('renders frequency keys as formatted description-key strings', () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      expect(screen.getAllByText('Hitting (A)').length).toBeGreaterThan(0);
    });

    it('renders duration keys as formatted description-key strings', () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      expect(screen.getAllByText('Running (B)').length).toBeGreaterThan(0);
    });

    it('renders an empty string for a keyset with no frequency keys', () => {
      const keysetNoFreq = makeKeyset('EmptyFreqSet', 'GroupA', 'ClientZ');
      keysetNoFreq.FrequencyKeys = [];
      render(<ViewerKeysetPage {...defaultProps} Keysets={[keysetNoFreq]} />);
      const rows = screen.getAllByTestId('table-row');
      expect(rows).toHaveLength(1);
    });
  });

  // ---- Import action ----

  describe('import action', () => {
    it('renders the import trigger button with label text', () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      expect(screen.getByTestId('import-trigger').textContent).toContain('Import KeySet(s)');
    });

    it('calls mutateAsync with correct group, individual, and handle when import is triggered', async () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('import-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individual: 'ClientB',
            Handle: makeHandle('root'),
          }),
        );
      });
    });

    it('passes the original keyset objects in the import payload', async () => {
      render(<ViewerKeysetPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('import-trigger'));
      await waitFor(() => {
        const call = mockMutateAsync.mock.calls[0][0];
        expect(call.KeySets).toHaveLength(2);
        expect(call.KeySets[0]).toMatchObject({ Name: 'BehaviorSet1' });
        expect(call.KeySets[1]).toMatchObject({ Name: 'BehaviorSet2' });
      });
    });

    it('calls mutateAsync with an empty KeySets array when no keysets are present', async () => {
      render(<ViewerKeysetPage {...defaultProps} Keysets={[]} />);
      fireEvent.click(screen.getByTestId('import-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ KeySets: [] }));
      });
    });
  });
});
