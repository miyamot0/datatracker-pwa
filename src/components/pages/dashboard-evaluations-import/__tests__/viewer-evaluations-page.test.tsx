import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ViewerEvaluationsPage from '../viewer-evaluations-page';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import { EvaluationRecord } from '@/queries/keysets/types/evaluation-record';

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
    isError: false,
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

vi.mock('@/queries/evaluations/mutate-evaluations-all', () => ({
  mutationEvaluationsAll: vi.fn(),
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({
    data,
    columns,
    callback,
    customCheckboxButton,
  }: {
    data: EvaluationRecord[];
    columns: Array<{ accessorKey?: string; cell?: (ctx: unknown) => React.ReactNode }>;
    callback: (rows: EvaluationRecord[]) => void;
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
            return col.accessorKey ? (
              <span key={ci}>{String(row[col.accessorKey as keyof EvaluationRecord] ?? '')}</span>
            ) : null;
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

const defaultEvaluations: EvaluationRecord[] = [
  { Group: 'GroupA', Individual: 'ClientB', Evaluation: 'EvalOwn', Conditions: ['Cond1'] },
  { Group: 'GroupA', Individual: 'ClientB', Evaluation: 'SharedEval', Conditions: ['Cond2'] },
  { Group: 'GroupX', Individual: 'ClientY', Evaluation: 'EvalOther', Conditions: ['Cond3', 'Cond4'] },
  { Group: 'GroupX', Individual: 'ClientY', Evaluation: 'SharedEval', Conditions: [] }, // same eval name as current client — should be filtered
];

const defaultProps = {
  Group: 'GroupA',
  Individual: 'ClientB',
  Handle: makeHandle('root'),
  Settings: { ...DEFAULT_APPLICATION_SETTINGS },
  Evaluations: defaultEvaluations,
};

// ----- Tests -----

describe('ViewerEvaluationsPage', () => {
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
      render(<ViewerEvaluationsPage {...defaultProps} />);
      expect(screen.getByText('Prior Evaluation Import')).not.toBeNull();
    });

    it('renders the card description', () => {
      render(<ViewerEvaluationsPage {...defaultProps} />);
      expect(screen.getByText('Import Existing Evaluations/Conditions')).not.toBeNull();
    });

    it('renders the BackButton', () => {
      render(<ViewerEvaluationsPage {...defaultProps} />);
      expect(screen.getByText('Back')).not.toBeNull();
    });

    it('renders the informational paragraph', () => {
      render(<ViewerEvaluationsPage {...defaultProps} />);
      expect(screen.getByText(/This page lists Evaluations/)).not.toBeNull();
    });
  });

  // ---- Filtering logic ----

  describe('filtering logic', () => {
    it('excludes rows belonging to the current Individual', () => {
      render(<ViewerEvaluationsPage {...defaultProps} />);
      // ClientB rows should not appear
      const rows = screen.queryAllByTestId('table-row');
      const texts = rows.map((r) => r.textContent ?? '');
      expect(texts.every((t) => !t.includes('ClientB'))).toBe(true);
    });

    it('excludes rows whose Evaluation name already belongs to the current Individual', () => {
      render(<ViewerEvaluationsPage {...defaultProps} />);
      // "SharedEval" exists for ClientB, so the ClientY/SharedEval row must also be omitted
      expect(screen.queryByText('SharedEval')).toBeNull();
    });

    it('includes rows from other individuals whose evaluation name is not already used', () => {
      render(<ViewerEvaluationsPage {...defaultProps} />);
      expect(screen.getByText('EvalOther')).not.toBeNull();
    });

    it('renders a row only for the eligible evaluation', () => {
      render(<ViewerEvaluationsPage {...defaultProps} />);
      expect(screen.getAllByTestId('table-row')).toHaveLength(1);
    });

    it('renders no rows when all other evaluations share a name with the current individual', () => {
      const allShared: EvaluationRecord[] = [
        { Group: 'GroupA', Individual: 'ClientB', Evaluation: 'EvalA', Conditions: [] },
        { Group: 'GroupX', Individual: 'ClientY', Evaluation: 'EvalA', Conditions: [] },
      ];
      render(<ViewerEvaluationsPage {...defaultProps} Evaluations={allShared} />);
      expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
    });
  });

  // ---- Column rendering ----

  describe('column rendering', () => {
    beforeEach(() => {
      render(<ViewerEvaluationsPage {...defaultProps} />);
    });

    it('renders the Group column value', () => {
      expect(screen.getByText('GroupX')).not.toBeNull();
    });

    it('renders the Individual column value', () => {
      expect(screen.getByText('ClientY')).not.toBeNull();
    });

    it('renders the Evaluation column value', () => {
      expect(screen.getByText('EvalOther')).not.toBeNull();
    });

    it('renders joined Conditions for the row', () => {
      expect(screen.getByText('Cond3, Cond4')).not.toBeNull();
    });
  });

  // ---- Import action ----

  describe('import action', () => {
    it('renders the import trigger button with label text', () => {
      render(<ViewerEvaluationsPage {...defaultProps} />);
      expect(screen.getByTestId('import-trigger').textContent).toContain('Import Evaluation(s)');
    });

    it('calls mutateAsync with Import action when callback is triggered', async () => {
      render(<ViewerEvaluationsPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('import-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individual: 'ClientB',
            Action: 'Import',
            RelevantRecords: expect.arrayContaining([expect.objectContaining({ Evaluation: 'EvalOther' })]),
          }),
        );
      });
    });

    it('does not include current-individual rows in the import payload', async () => {
      render(<ViewerEvaluationsPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('import-trigger'));
      await waitFor(() => {
        const call = mockMutateAsync.mock.calls[0][0];
        expect(call.RelevantRecords.every((r: EvaluationRecord) => r.Individual !== 'ClientB')).toBe(true);
      });
    });
  });
});
