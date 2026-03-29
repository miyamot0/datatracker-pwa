import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import KeySetsPage from '../keysets-page';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import { KeySet } from '@/types/keyset';

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

vi.mock('@/queries/keysets/mutate-keyboards', () => ({
  mutationKeyboards: vi.fn(),
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({
    data,
    columns,
    callback,
    optionalButtons,
  }: {
    data: KeySet[];
    columns: Array<{ accessorKey?: string; cell?: (ctx: unknown) => React.ReactNode }>;
    callback: (rows: KeySet[]) => void;
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
              <span key={ci}>{String((row as unknown as Record<string, unknown>)[col.accessorKey] ?? '')}</span>
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

vi.mock('@/components/ui/tooltip-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ----- Helpers -----

const makeHandle = (name: string) => ({ name }) as FileSystemDirectoryHandle;

const makeKeyset = (name: string): KeySet =>
  ({
    id: `id-${name}`,
    Name: name,
    FrequencyKeys: [{ KeyName: 'a', KeyDescription: 'Hitting', KeyCode: 65 }],
    DurationKeys: [{ KeyName: 'b', KeyDescription: 'Running', KeyCode: 66 }],
    createdAt: new Date('2026-02-15'),
    lastModified: new Date('2026-02-15'),
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
  }) as KeySet;

const sampleKeysets = [makeKeyset('SetAlpha'), makeKeyset('SetBeta')];

const defaultProps = {
  Group: 'GroupA',
  Individual: 'ClientB',
  KeySets: sampleKeysets,
  Settings: { ...DEFAULT_APPLICATION_SETTINGS },
  Handle: makeHandle('root'),
};

// ----- Tests -----

describe('KeySetsPage', () => {
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
      render(<KeySetsPage {...defaultProps} />);
      expect(screen.getByText('Keyset Directory: ClientB')).not.toBeNull();
    });

    it('shows the card description', () => {
      render(<KeySetsPage {...defaultProps} />);
      expect(screen.getByText('Create or Edit Current Keysets')).not.toBeNull();
    });

    it('renders the BackButton', () => {
      render(<KeySetsPage {...defaultProps} />);
      expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
    });

    it('renders the informational paragraph', () => {
      render(<KeySetsPage {...defaultProps} />);
      expect(screen.getByText(/keysets that have been created for the client/i)).not.toBeNull();
    });
  });

  // ---- Keyset table ----

  describe('keyset table', () => {
    it('renders a row for each keyset', () => {
      render(<KeySetsPage {...defaultProps} />);
      expect(screen.getAllByTestId('table-row')).toHaveLength(2);
    });

    it('renders an empty table when no keysets are provided', () => {
      render(<KeySetsPage {...defaultProps} KeySets={[]} />);
      expect(screen.queryAllByTestId('table-row')).toHaveLength(0);
    });

    it('renders the Name column value for each row', () => {
      render(<KeySetsPage {...defaultProps} />);
      expect(screen.getByText('SetAlpha')).not.toBeNull();
      expect(screen.getByText('SetBeta')).not.toBeNull();
    });

    it('renders frequency keys as formatted description-key strings', () => {
      render(<KeySetsPage {...defaultProps} />);
      expect(screen.getAllByText('Hitting (A)').length).toBeGreaterThan(0);
    });

    it('renders duration keys as formatted description-key strings', () => {
      render(<KeySetsPage {...defaultProps} />);
      expect(screen.getAllByText('Running (B)').length).toBeGreaterThan(0);
    });

    it('renders the createdAt date as a localized string', () => {
      render(<KeySetsPage {...defaultProps} />);
      const expectedDate = sampleKeysets[0].createdAt.toLocaleDateString();
      expect(screen.getAllByText(expectedDate).length).toBeGreaterThan(0);
    });
  });

  // ---- Row action buttons ----

  describe('row action buttons', () => {
    it('renders a Duplicate button for each row', () => {
      render(<KeySetsPage {...defaultProps} />);
      expect(screen.getAllByRole('button', { name: /duplicate/i })).toHaveLength(2);
    });

    it('renders an Edit link for each row', () => {
      render(<KeySetsPage {...defaultProps} />);
      const editLinks = screen.getAllByRole('link', { name: /edit/i });
      expect(editLinks.length).toBeGreaterThanOrEqual(2);
    });

    it('Edit link navigates to the keyset edit route', () => {
      render(<KeySetsPage {...defaultProps} />);
      const editLinks = screen.getAllByRole('link', { name: /edit/i });
      expect(editLinks[0].getAttribute('href')).toBe('/session/$group/$individual/keysets/$keyset');
    });

    it('Edit link has correct group, individual, and keyset params', () => {
      render(<KeySetsPage {...defaultProps} />);
      const editLinks = screen.getAllByRole('link', { name: /edit/i });
      const params = JSON.parse(editLinks[0].getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'ClientB', keyset: 'SetAlpha' });
    });
  });

  // ---- Duplicate keyset ----

  describe('duplicate keyset', () => {
    it('does nothing when the duplicate prompt is cancelled', async () => {
      promptSpy.mockReturnValue(null);
      render(<KeySetsPage {...defaultProps} />);
      fireEvent.click(screen.getAllByRole('button', { name: /duplicate/i })[0]);
      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('does nothing when the duplicate name is too short (fewer than 4 characters)', async () => {
      promptSpy.mockReturnValue('ab');
      render(<KeySetsPage {...defaultProps} />);
      fireEvent.click(screen.getAllByRole('button', { name: /duplicate/i })[0]);
      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('calls mutateAsync with Duplicate action for a valid name', async () => {
      promptSpy.mockReturnValue('SetAlpha_Copy');
      render(<KeySetsPage {...defaultProps} />);
      fireEvent.click(screen.getAllByRole('button', { name: /duplicate/i })[0]);
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individual: 'ClientB',
            Keysets: ['SetAlpha'],
            Rename: 'SetAlpha_Copy',
            Action: 'Duplicate',
          }),
        );
      });
    });
  });

  // ---- Delete keysets ----

  describe('delete keysets', () => {
    it('shows a confirmation dialog when delete is triggered', () => {
      render(<KeySetsPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining('2 KeySets'));
    });

    it('does not call mutateAsync when delete is cancelled', async () => {
      confirmSpy.mockReturnValue(false);
      render(<KeySetsPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('calls mutateAsync with Delete action when confirmed', async () => {
      confirmSpy.mockReturnValue(true);
      render(<KeySetsPage {...defaultProps} />);
      fireEvent.click(screen.getByTestId('delete-trigger'));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individual: 'ClientB',
            Keysets: ['SetAlpha', 'SetBeta'],
            Action: 'Delete',
          }),
        );
      });
    });
  });

  // ---- Create keyset ----

  describe('create keyset', () => {
    it('renders the Create button in optional buttons', () => {
      render(<KeySetsPage {...defaultProps} />);
      expect(screen.getByRole('button', { name: /create/i })).not.toBeNull();
    });

    it('does nothing when the create prompt is cancelled', async () => {
      promptSpy.mockReturnValue(null);
      render(<KeySetsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });

    it('shows alert when name is too short (fewer than 4 characters)', async () => {
      promptSpy.mockReturnValue('abc');
      render(<KeySetsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('at least 4 characters'));
      });
    });

    it('shows alert when a keyset with that name already exists', async () => {
      promptSpy.mockReturnValue('SetAlpha');
      render(<KeySetsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));
      });
    });

    it('calls mutateAsync with Add action for a valid new keyset name', async () => {
      promptSpy.mockReturnValue('SetGamma');
      render(<KeySetsPage {...defaultProps} />);
      fireEvent.click(screen.getByRole('button', { name: /create/i }));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'GroupA',
            Individual: 'ClientB',
            Keysets: ['SetGamma'],
            Action: 'Add',
          }),
        );
      });
    });
  });

  // ---- Import link ----

  describe('import link', () => {
    it('renders the Import link in optional buttons', () => {
      render(<KeySetsPage {...defaultProps} />);
      expect(screen.getByRole('link', { name: /import/i })).not.toBeNull();
    });

    it('Import link navigates to the keyset import route', () => {
      render(<KeySetsPage {...defaultProps} />);
      const importLink = screen.getByRole('link', { name: /import/i });
      expect(importLink.getAttribute('href')).toBe('/session/$group/$individual/keysets/import');
    });

    it('Import link has correct group and individual params', () => {
      render(<KeySetsPage {...defaultProps} />);
      const importLink = screen.getByRole('link', { name: /import/i });
      const params = JSON.parse(importLink.getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'ClientB' });
    });
  });
});
