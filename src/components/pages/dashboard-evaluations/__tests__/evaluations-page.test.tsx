import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EvaluationsPage from '../evaluations-page';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';

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

vi.mock('@/queries/evaluations/mutate-evaluations', () => ({
  mutationEvaluations: vi.fn(),
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({
    data,
    columns,
    callback,
    optionalButtons,
  }: {
    data: Array<Record<string, unknown>>;
    columns: Array<{
      accessorKey?: string;
      cell?: (ctx: unknown) => React.ReactNode;
    }>;
    callback: (rows: Array<Record<string, unknown>>) => void;
    optionalButtons?: React.ReactNode;
    settings?: unknown;
    filterCol?: string;
  }) => (
    <div>
      {optionalButtons}
      {data.map((row, i) => (
        <div key={i} data-testid="table-row">
          {columns.map((col, ci) => {
            if (col.cell) {
              const cellContent = col.cell({ row: { original: row } });
              return <React.Fragment key={ci}>{cellContent}</React.Fragment>;
            }
            return col.accessorKey ? <span key={ci}>{String(row[col.accessorKey] ?? '')}</span> : null;
          })}
        </div>
      ))}
      <button data-testid="delete-trigger" onClick={() => callback(data)}>
        Delete Selected
      </button>
    </div>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <div role="menuitem" onClick={onClick}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

vi.mock('@/components/ui/tooltip-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ----- Helpers -----

const makeHandle = (name: string) => ({ name }) as FileSystemDirectoryHandle;

const defaultProps = {
  Group: 'GroupA',
  Individual: 'ClientB',
  Evaluations: ['Eval1', 'Eval2'],
  Settings: { ...DEFAULT_APPLICATION_SETTINGS, EnableFileDeletion: false },
  Handle: makeHandle('root'),
};

const propsWithDeletion = {
  ...defaultProps,
  Settings: { ...DEFAULT_APPLICATION_SETTINGS, EnableFileDeletion: true },
};

// ----- Tests -----

describe('EvaluationsPage', () => {
  let promptSpy: ReturnType<typeof vi.spyOn>;
  let confirmSpy: ReturnType<typeof vi.spyOn>;
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    mockMutateAsync.mockClear();
    mockMutateAsync.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Card layout ----

  describe('card layout', () => {
    it('shows the individual name in the card title', () => {
      render(<EvaluationsPage {...defaultProps} />);
      expect(screen.getByText('Evaluation Directory: ClientB')).not.toBeNull();
    });

    it('shows the card description', () => {
      render(<EvaluationsPage {...defaultProps} />);
      expect(screen.getByText('Select Evaluation to Build Session')).not.toBeNull();
    });

    it('renders the informational paragraph', () => {
      render(<EvaluationsPage {...defaultProps} />);
      expect(screen.getByText(/This page provides a list of all evaluations/)).not.toBeNull();
    });

    it('renders the BackButton', () => {
      render(<EvaluationsPage {...defaultProps} />);
      expect(screen.getByText('Back')).not.toBeNull();
    });
  });

  // ---- Evaluation table rows ----

  describe('evaluation table', () => {
    it('renders a row for each evaluation', () => {
      render(<EvaluationsPage {...defaultProps} />);
      expect(screen.getAllByTestId('table-row')).toHaveLength(2);
    });

    it('renders evaluation names in the table', () => {
      render(<EvaluationsPage {...defaultProps} />);
      expect(screen.getByText('Eval1')).not.toBeNull();
      expect(screen.getByText('Eval2')).not.toBeNull();
    });

    it('renders an empty table when no evaluations are provided', () => {
      render(<EvaluationsPage {...defaultProps} Evaluations={[]} />);
      expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
    });
  });

  // ---- Optional action buttons ----

  describe('action buttons', () => {
    it('renders the Create button', () => {
      render(<EvaluationsPage {...defaultProps} />);
      expect(screen.getByRole('button', { name: /create/i })).not.toBeNull();
    });

    it('renders the Import button', () => {
      render(<EvaluationsPage {...defaultProps} />);
      expect(screen.getByRole('button', { name: /import/i })).not.toBeNull();
    });

    it('renders the KeySets button', () => {
      render(<EvaluationsPage {...defaultProps} />);
      expect(screen.getByRole('button', { name: /keysets/i })).not.toBeNull();
    });

    it('Import link navigates to the correct route with group and individual params', () => {
      render(<EvaluationsPage {...defaultProps} />);
      const importLink = screen.getByRole('link', { name: /import/i });
      expect(importLink.getAttribute('href')).toBe('/session/$group/$individual/import');
      const params = JSON.parse(importLink.getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'ClientB' });
    });

    it('KeySets link navigates to the correct route with group and individual params', () => {
      render(<EvaluationsPage {...defaultProps} />);
      const keySetsLink = screen.getByRole('link', { name: /keysets/i });
      expect(keySetsLink.getAttribute('href')).toBe('/session/$group/$individual/keysets');
      const params = JSON.parse(keySetsLink.getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'ClientB' });
    });
  });

  // ---- Row-level action links ----

  describe('row action links', () => {
    it('renders a "Record Sessions" link for each evaluation row', () => {
      render(<EvaluationsPage {...defaultProps} />);
      expect(screen.getAllByText('Record Sessions')).toHaveLength(2);
    });

    it('"Record Sessions" link for the first row has correct route and params', () => {
      render(<EvaluationsPage {...defaultProps} />);
      const links = screen.getAllByRole('link', { name: /record sessions/i });
      expect(links[0].getAttribute('href')).toBe('/session/$group/$individual/$evaluation');
      const params = JSON.parse(links[0].getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'ClientB', evaluation: 'Eval1' });
    });

    it('"Record Sessions" link for the second row has correct params', () => {
      render(<EvaluationsPage {...defaultProps} />);
      const links = screen.getAllByRole('link', { name: /record sessions/i });
      const params = JSON.parse(links[1].getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'ClientB', evaluation: 'Eval2' });
    });

    it('renders all dropdown action items for each evaluation row', () => {
      render(<EvaluationsPage {...defaultProps} />);
      expect(screen.getAllByText('Review Session Data')).toHaveLength(2);
      expect(screen.getAllByText('Summarize Session Data')).toHaveLength(2);
      expect(screen.getAllByText('Analyze Frequency Data')).toHaveLength(2);
      expect(screen.getAllByText('Analyze Duration Data')).toHaveLength(2);
      expect(screen.getAllByText('Calculate Reliability')).toHaveLength(2);
    });

    it('"Review Session Data" links to history route with correct params', () => {
      render(<EvaluationsPage {...defaultProps} />);
      const links = screen.getAllByRole('link', { name: /review session data/i });
      expect(links[0].getAttribute('href')).toBe('/session/$group/$individual/$evaluation/history');
      const params = JSON.parse(links[0].getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'ClientB', evaluation: 'Eval1' });
    });

    it('"Summarize Session Data" links to view route', () => {
      render(<EvaluationsPage {...defaultProps} />);
      const links = screen.getAllByRole('link', { name: /summarize session data/i });
      expect(links[0].getAttribute('href')).toBe('/session/$group/$individual/$evaluation/view');
    });

    it('"Analyze Frequency Data" links to rate route', () => {
      render(<EvaluationsPage {...defaultProps} />);
      const links = screen.getAllByRole('link', { name: /analyze frequency data/i });
      expect(links[0].getAttribute('href')).toBe('/session/$group/$individual/$evaluation/rate');
    });

    it('"Analyze Duration Data" links to proportion route', () => {
      render(<EvaluationsPage {...defaultProps} />);
      const links = screen.getAllByRole('link', { name: /analyze duration data/i });
      expect(links[0].getAttribute('href')).toBe('/session/$group/$individual/$evaluation/proportion');
    });

    it('"Calculate Reliability" links to reli route', () => {
      render(<EvaluationsPage {...defaultProps} />);
      const links = screen.getAllByRole('link', { name: /calculate reliability/i });
      expect(links[0].getAttribute('href')).toBe('/session/$group/$individual/$evaluation/reli');
    });
  });

  // ---- EnableFileDeletion ----

  describe('EnableFileDeletion', () => {
    it('hides Duplicate and Rename items when EnableFileDeletion is false', () => {
      render(<EvaluationsPage {...defaultProps} />);
      expect(screen.queryByText('Duplicate Evaluation')).toBeNull();
      expect(screen.queryByText('Rename Evaluation')).toBeNull();
    });

    it('shows Duplicate and Rename items for each row when EnableFileDeletion is true', () => {
      render(<EvaluationsPage {...propsWithDeletion} />);
      expect(screen.getAllByText('Duplicate Evaluation')).toHaveLength(2);
      expect(screen.getAllByText('Rename Evaluation')).toHaveLength(2);
    });
  });

  // ---- Create evaluation ----

  describe('Create evaluation', () => {
    it('does nothing when the prompt is cancelled', () => {
      promptSpy.mockReturnValue(null);
      render(<EvaluationsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('does nothing when the entered name is shorter than 4 characters', () => {
      promptSpy.mockReturnValue('abc');
      render(<EvaluationsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('alerts and does not call mutation when evaluation already exists', () => {
      promptSpy.mockReturnValue('Eval1');
      render(<EvaluationsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      expect(alertSpy).toHaveBeenCalledWith('Evaluation already exists.');
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutation with Add action for a valid new name', async () => {
      promptSpy.mockReturnValue('BrandNewEval');
      render(<EvaluationsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individual: 'ClientB',
            Evaluations: ['BrandNewEval'],
            Action: 'Add',
          }),
        );
      });
    });
  });

  // ---- Delete evaluations ----

  describe('Delete evaluations', () => {
    it('does nothing when the user cancels the confirmation', () => {
      confirmSpy.mockReturnValue(false);
      render(<EvaluationsPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutation with Delete action for all rows when confirmed', async () => {
      confirmSpy.mockReturnValue(true);
      render(<EvaluationsPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individual: 'ClientB',
            Evaluations: ['Eval1', 'Eval2'],
            Action: 'Delete',
          }),
        );
      });
    });
  });

  // ---- Duplicate evaluation ----

  describe('Duplicate evaluation', () => {
    it('does nothing when the prompt is cancelled', () => {
      promptSpy.mockReturnValue(null);
      render(<EvaluationsPage {...propsWithDeletion} />);
      const duplicateItem = screen
        .getAllByRole('menuitem')
        .find((el) => el.textContent?.includes('Duplicate Evaluation'))!;
      fireEvent.click(duplicateItem);
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('does nothing when the entered name is shorter than 4 characters', () => {
      promptSpy.mockReturnValue('ab');
      render(<EvaluationsPage {...propsWithDeletion} />);
      const duplicateItem = screen
        .getAllByRole('menuitem')
        .find((el) => el.textContent?.includes('Duplicate Evaluation'))!;
      fireEvent.click(duplicateItem);
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutation with Duplicate action for a valid name', async () => {
      promptSpy.mockReturnValue('Eval1_Copy');
      render(<EvaluationsPage {...propsWithDeletion} />);
      const duplicateItem = screen
        .getAllByRole('menuitem')
        .find((el) => el.textContent?.includes('Duplicate Evaluation'))!;
      fireEvent.click(duplicateItem);
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individual: 'ClientB',
            Evaluations: ['Eval1'],
            Action: 'Duplicate',
            Rename: 'Eval1_Copy',
          }),
        );
      });
    });
  });

  // ---- Rename evaluation ----

  describe('Rename evaluation', () => {
    it('does nothing when the prompt is cancelled', () => {
      promptSpy.mockReturnValue(null);
      render(<EvaluationsPage {...propsWithDeletion} />);
      const renameItem = screen.getAllByRole('menuitem').find((el) => el.textContent?.includes('Rename Evaluation'))!;
      fireEvent.click(renameItem);
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('does nothing when the entered name is shorter than 4 characters', () => {
      promptSpy.mockReturnValue('ab');
      render(<EvaluationsPage {...propsWithDeletion} />);
      const renameItem = screen.getAllByRole('menuitem').find((el) => el.textContent?.includes('Rename Evaluation'))!;
      fireEvent.click(renameItem);
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutation with Rename action for a valid name', async () => {
      promptSpy.mockReturnValue('RenamedEvaluation');
      render(<EvaluationsPage {...propsWithDeletion} />);
      const renameItem = screen.getAllByRole('menuitem').find((el) => el.textContent?.includes('Rename Evaluation'))!;
      fireEvent.click(renameItem);
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individual: 'ClientB',
            Evaluations: ['Eval1'],
            Action: 'Rename',
            Rename: 'RenamedEvaluation',
          }),
        );
      });
    });
  });
});
