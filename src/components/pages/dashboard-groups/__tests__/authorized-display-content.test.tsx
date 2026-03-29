import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import AuthorizedDisplayContent from '../authorized-display-content';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';

// ----- Hoisted refs -----
const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockSetQueryData = vi.hoisted(() => vi.fn());

// ----- Module mocks -----

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(({ onSuccess }) => ({
    mutateAsync: async (...args: unknown[]) => {
      const result = await mockMutateAsync(...args);
      if (onSuccess) await onSuccess(result);
      return result;
    },
    isPending: false,
  })),
  useQueryClient: () => ({
    setQueryData: mockSetQueryData,
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  }),
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

vi.mock('@/queries/groups/mutate-groups', () => ({
  mutationGroups: vi.fn(),
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({
    data,
    columns,
    callback,
    optionalButtons,
  }: {
    data: Array<{ Group: string }>;
    columns: Array<{ accessorKey?: string; cell?: (ctx: unknown) => React.ReactNode }>;
    callback: (rows: Array<{ Group: string }>) => void;
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
            return col.accessorKey ? (
              <span key={ci}>{String(row[col.accessorKey as keyof typeof row] ?? '')}</span>
            ) : null;
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

// ----- Helpers -----

const makeHandle = (name: string) => ({ name }) as FileSystemDirectoryHandle;

const defaultProps = {
  Groups: ['GroupOne', 'GroupTwo'],
  Settings: { ...DEFAULT_APPLICATION_SETTINGS },
  Handle: makeHandle('root'),
};

// ----- Tests -----

describe('AuthorizedDisplayContent', () => {
  let promptSpy: ReturnType<typeof vi.spyOn>;
  let confirmSpy: ReturnType<typeof vi.spyOn>;
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    promptSpy = vi.spyOn(window, 'prompt').mockReturnValue(null);
    confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);
    mockMutateAsync.mockClear();
    mockSetQueryData.mockClear();
    mockMutateAsync.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Card layout ----

  describe('card layout', () => {
    it('renders the card title', () => {
      render(<AuthorizedDisplayContent {...defaultProps} />);
      expect(screen.getByText('Directory of Groups')).not.toBeNull();
    });

    it('renders the card description', () => {
      render(<AuthorizedDisplayContent {...defaultProps} />);
      expect(screen.getByText('Open Group to Load Relevant Client Data')).not.toBeNull();
    });

    it('renders the informational paragraph', () => {
      render(<AuthorizedDisplayContent {...defaultProps} />);
      expect(screen.getByText(/Each entry in this page represents/)).not.toBeNull();
    });

    it('renders the BackButton', () => {
      render(<AuthorizedDisplayContent {...defaultProps} />);
      expect(screen.getByText('Back')).not.toBeNull();
    });
  });

  // ---- Group table ----

  describe('group table', () => {
    it('renders a row for each group', () => {
      render(<AuthorizedDisplayContent {...defaultProps} />);
      expect(screen.getAllByTestId('table-row')).toHaveLength(2);
    });

    it('renders group names in the table', () => {
      render(<AuthorizedDisplayContent {...defaultProps} />);
      expect(screen.getByText('GroupOne')).not.toBeNull();
      expect(screen.getByText('GroupTwo')).not.toBeNull();
    });

    it('renders an empty table when no groups are provided', () => {
      render(<AuthorizedDisplayContent {...defaultProps} Groups={[]} />);
      expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
    });
  });

  // ---- Row action links ----

  describe('row action links', () => {
    it('renders an "Open Group" link for each row', () => {
      render(<AuthorizedDisplayContent {...defaultProps} />);
      expect(screen.getAllByText('Open Group')).toHaveLength(2);
    });

    it('"Open Group" link for the first row navigates to the correct route with group param', () => {
      render(<AuthorizedDisplayContent {...defaultProps} />);
      const links = screen.getAllByRole('link', { name: /open group/i });
      expect(links[0].getAttribute('href')).toBe('/session/$group');
      const params = JSON.parse(links[0].getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupOne' });
    });

    it('"Open Group" link for the second row has correct group param', () => {
      render(<AuthorizedDisplayContent {...defaultProps} />);
      const links = screen.getAllByRole('link', { name: /open group/i });
      const params = JSON.parse(links[1].getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupTwo' });
    });
  });

  // ---- Optional buttons ----

  describe('action buttons', () => {
    it('renders the Extract Example Folder button', () => {
      render(<AuthorizedDisplayContent {...defaultProps} />);
      expect(screen.getByRole('button', { name: /extract example folder/i })).not.toBeNull();
    });

    it('renders the Create button', () => {
      render(<AuthorizedDisplayContent {...defaultProps} />);
      expect(screen.getByRole('button', { name: /create/i })).not.toBeNull();
    });
  });

  // ---- Extract Example Folder ----

  describe('Extract Example Folder', () => {
    it('does nothing when user cancels the confirmation', async () => {
      confirmSpy.mockReturnValueOnce(false);
      render(<AuthorizedDisplayContent {...defaultProps} />);
      const btn = screen.getByRole('button', { name: /extract example folder/i });
      // The async onClick throws 'User cancelled action' when confirm is false.
      // Suppress at the process level so Vitest doesn't treat it as a test error.
      const suppressHandler = (err: Error) => {
        if (err?.message?.includes('User cancelled action')) return;
        throw err;
      };
      process.on('unhandledRejection', suppressHandler as NodeJS.UnhandledRejectionListener);
      fireEvent.click(btn);
      await new Promise((r) => setTimeout(r, 10));
      process.off('unhandledRejection', suppressHandler as NodeJS.UnhandledRejectionListener);
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutation with Demo action when confirmed', async () => {
      confirmSpy.mockReturnValueOnce(true);
      render(<AuthorizedDisplayContent {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /extract example folder/i }));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ Action: 'Demo' }));
      });
    });
  });

  // ---- Create group ----

  describe('Create group', () => {
    it('does nothing when the prompt is cancelled', () => {
      promptSpy.mockReturnValue(null);
      render(<AuthorizedDisplayContent {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('does nothing when the entered name is shorter than 4 characters', () => {
      promptSpy.mockReturnValue('abc');
      render(<AuthorizedDisplayContent {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('alerts and does not call mutation when group already exists', () => {
      promptSpy.mockReturnValue('GroupOne');
      render(<AuthorizedDisplayContent {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
      expect(alertSpy).toHaveBeenCalledWith('Group already exists.');
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutation with Add action for a valid new group name', async () => {
      promptSpy.mockReturnValue('NewGroup123');
      render(<AuthorizedDisplayContent {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /^create$/i }));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: ['NewGroup123'],
            Action: 'Add',
          }),
        );
      });
    });
  });

  // ---- Delete groups ----

  describe('Delete groups', () => {
    it('does nothing when the user cancels the confirmation', () => {
      confirmSpy.mockReturnValue(false);
      render(<AuthorizedDisplayContent {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutation with Delete action when confirmed', async () => {
      confirmSpy.mockReturnValue(true);
      render(<AuthorizedDisplayContent {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: ['GroupOne', 'GroupTwo'],
            Action: 'Delete',
          }),
        );
      });
    });
  });
});
