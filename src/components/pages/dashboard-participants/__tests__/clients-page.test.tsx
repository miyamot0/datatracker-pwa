import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ClientsPage from '../clients-page';
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

vi.mock('@/queries/individuals/mutate-individuals', () => ({
  mutationIndividuals: vi.fn(),
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({
    data,
    columns,
    callback,
    optionalButtons,
  }: {
    data: Array<Record<string, unknown>>;
    columns: Array<{ accessorKey?: string; cell?: (ctx: unknown) => React.ReactNode }>;
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
              return <React.Fragment key={ci}>{col.cell({ row: { original: row } })}</React.Fragment>;
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
  Clients: ['Alice', 'BobSmith'],
  Handle: makeHandle('root'),
  Settings: { ...DEFAULT_APPLICATION_SETTINGS },
};

// ----- Tests -----

describe('ClientsPage', () => {
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
    it('shows the group name in the card title', () => {
      render(<ClientsPage {...defaultProps} />);
      expect(screen.getByText('Client Directory: GroupA')).not.toBeNull();
    });

    it('shows the card description', () => {
      render(<ClientsPage {...defaultProps} />);
      expect(screen.getByText('Select clients to develop and evaluate outcomes')).not.toBeNull();
    });

    it('renders the BackButton', () => {
      render(<ClientsPage {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
    });

    it('renders the informational paragraph', () => {
      render(<ClientsPage {...defaultProps} />);
      expect(screen.getByText(/individual clients/i)).not.toBeNull();
    });
  });

  // ---- Client table ----

  describe('client table', () => {
    it('renders a row for each client', () => {
      render(<ClientsPage {...defaultProps} />);
      expect(screen.getAllByTestId('table-row')).toHaveLength(2);
    });

    it('renders client names in the table', () => {
      render(<ClientsPage {...defaultProps} />);
      expect(screen.getByText('Alice')).not.toBeNull();
      expect(screen.getByText('BobSmith')).not.toBeNull();
    });

    it('renders an empty table when no clients are provided', () => {
      render(<ClientsPage {...defaultProps} Clients={[]} />);
      expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
    });
  });

  // ---- Row action links ----

  describe('row action links', () => {
    it('renders an "Open Evaluations" link for each row', () => {
      render(<ClientsPage {...defaultProps} />);
      expect(screen.getAllByText('Open Evaluations')).toHaveLength(2);
    });

    it('"Open Evaluations" link navigates to the correct route', () => {
      render(<ClientsPage {...defaultProps} />);
      const links = screen.getAllByRole('link', { name: /open evaluations/i });
      expect(links[0].getAttribute('href')).toBe('/session/$group/$individual');
    });

    it('"Open Evaluations" link has correct params for the first row', () => {
      render(<ClientsPage {...defaultProps} />);
      const links = screen.getAllByRole('link', { name: /open evaluations/i });
      const params = JSON.parse(links[0].getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'Alice' });
    });

    it('"Open Evaluations" link has correct params for the second row', () => {
      render(<ClientsPage {...defaultProps} />);
      const links = screen.getAllByRole('link', { name: /open evaluations/i });
      const params = JSON.parse(links[1].getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'BobSmith' });
    });
  });

  // ---- Delete clients ----

  describe('delete clients', () => {
    it('shows a confirmation dialog with the correct count', () => {
      render(<ClientsPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('2 client(s)'));
    });

    it('does not call mutateAsync when delete is cancelled', async () => {
      confirmSpy.mockReturnValue(false);
      render(<ClientsPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('calls mutateAsync with Delete action when confirmed', async () => {
      confirmSpy.mockReturnValue(true);
      render(<ClientsPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individuals: ['Alice', 'BobSmith'],
            Action: 'Delete',
          }),
        );
      });
    });

    it('passes the Handle to the delete mutation', async () => {
      confirmSpy.mockReturnValue(true);
      render(<ClientsPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ Handle: makeHandle('root') }));
      });
    });
  });

  // ---- Create client ----

  describe('create client', () => {
    it('renders the Create button in optional buttons', () => {
      render(<ClientsPage {...defaultProps} />);
      expect(screen.getByRole('button', { name: /create/i })).not.toBeNull();
    });

    it('does nothing when prompt is cancelled (null)', async () => {
      promptSpy.mockReturnValue(null);
      render(<ClientsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('shows alert when client name already exists', async () => {
      promptSpy.mockReturnValue('Alice');
      render(<ClientsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));
      });
    });

    it('shows alert when name is too short (fewer than 4 characters)', async () => {
      promptSpy.mockReturnValue('ab');
      render(<ClientsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('at least 4 characters'));
      });
    });

    it('calls mutateAsync with Add action for a valid new client name', async () => {
      promptSpy.mockReturnValue('Charlie');
      render(<ClientsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individuals: ['Charlie'],
            Action: 'Add',
          }),
        );
      });
    });

    it('trims whitespace from the provided client name before adding', async () => {
      promptSpy.mockReturnValue('  DaveTest  ');
      render(<ClientsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ Individuals: ['DaveTest'] }));
      });
    });
  });
});
