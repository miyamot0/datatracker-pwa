import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import EvaluationsPage from '../evaluations-page';
import { ThemeProvider } from '@/components/ui/theme-provider';
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

function renderPage(props: React.ComponentProps<typeof EvaluationsPage>) {
  return render(
    <ThemeProvider defaultTheme="light" storageKey="test-theme">
      <EvaluationsPage {...props} />
    </ThemeProvider>,
  );
}

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
    it('shows the individual name in the card title', async () => {
      renderPage({ ...defaultProps });
      await expect.element(page.getByText('Evaluation Directory: ClientB')).toBeVisible();
    });

    it('shows the card description', async () => {
      renderPage({ ...defaultProps });
      await expect.element(page.getByText('Select Evaluation to Build Session')).toBeVisible();
    });

    it('renders the informational paragraph', async () => {
      renderPage({ ...defaultProps });
      await expect.element(page.getByText(/This page provides a list of all evaluations/)).toBeVisible();
    });

    it('renders the BackButton', async () => {
      renderPage({ ...defaultProps });
      await expect.element(page.getByText('Back')).toBeVisible();
    });
  });

  // ---- Evaluation table rows ----

  describe('evaluation table', () => {
    it('renders a row for each evaluation', async () => {
      renderPage({ ...defaultProps });
      await expect.element(page.getByTestId('table-row')).toHaveLength(2);
    });

    it('renders evaluation names in the table', async () => {
      renderPage({ ...defaultProps });
      await expect.element(page.getByText('Eval1')).toBeVisible();
      await expect.element(page.getByText('Eval2')).toBeVisible();
    });

    it('renders an empty table when no evaluations are provided', async () => {
      renderPage({ ...defaultProps, Evaluations: [] });
      await expect.element(page.getByTestId('table-row')).toHaveLength(0);

      await page.screenshot({ path: 'example screenshot.png' });
    });
  });

  // ---- Optional action buttons ----

  describe('action buttons', () => {
    it('renders the Create button', async () => {
      renderPage({ ...defaultProps });
      await expect.element(page.getByRole('button', { name: /create/i })).toBeVisible();
    });

    it('renders the Import button', async () => {
      renderPage({ ...defaultProps });
      await expect.element(page.getByRole('button', { name: /import/i })).toBeVisible();
    });

    it('renders the KeySets button', async () => {
      renderPage({ ...defaultProps });
      await expect.element(page.getByRole('button', { name: /keysets/i })).toBeVisible();
    });

    it('Import link navigates to the correct route with group and individual params', async () => {
      renderPage({ ...defaultProps });
      const importLink = page.getByRole('link', { name: /import/i });
      await expect.element(importLink).toBeVisible();
      expect(importLink.element().getAttribute('href')).toBe('/session/$group/$individual/import');
      const params = JSON.parse(importLink.element().getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'ClientB' });
    });

    it('KeySets link navigates to the correct route with group and individual params', async () => {
      renderPage({ ...defaultProps });
      const keySetsLink = page.getByRole('link', { name: /keysets/i });
      await expect.element(keySetsLink).toBeVisible();
      expect(keySetsLink.element().getAttribute('href')).toBe('/session/$group/$individual/keysets');
      const params = JSON.parse(keySetsLink.element().getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'ClientB' });
    });
  });

  // ---- Row-level action links ----

  describe('row action links', () => {
    it('renders a "Record Sessions" link for each evaluation row', async () => {
      renderPage({ ...defaultProps });
      await expect.element(page.getByText('Record Sessions')).toHaveLength(2);
    });

    it('"Record Sessions" link for the first row has correct route and params', async () => {
      renderPage({ ...defaultProps });
      const firstLink = page.getByRole('link', { name: /record sessions/i }).nth(0);
      await expect.element(firstLink).toBeVisible();
      expect(firstLink.element().getAttribute('href')).toBe('/session/$group/$individual/$evaluation');
      const params = JSON.parse(firstLink.element().getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'ClientB', evaluation: 'Eval1' });
    });

    it('"Record Sessions" link for the second row has correct params', async () => {
      renderPage({ ...defaultProps });
      const secondLink = page.getByRole('link', { name: /record sessions/i }).nth(1);
      await expect.element(secondLink).toBeVisible();
      const params = JSON.parse(secondLink.element().getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'ClientB', evaluation: 'Eval2' });
    });

    it('renders all dropdown action items for each evaluation row', async () => {
      renderPage({ ...defaultProps });
      await expect.element(page.getByText('Review Session Data')).toHaveLength(2);
      await expect.element(page.getByText('Summarize Session Data')).toHaveLength(2);
      await expect.element(page.getByText('Analyze Frequency Data')).toHaveLength(2);
      await expect.element(page.getByText('Analyze Duration Data')).toHaveLength(2);
      await expect.element(page.getByText('Calculate Reliability')).toHaveLength(2);
    });

    it('"Review Session Data" links to history route with correct params', async () => {
      renderPage({ ...defaultProps });
      const firstLink = page.getByRole('link', { name: /review session data/i }).nth(0);
      await expect.element(firstLink).toBeVisible();
      expect(firstLink.element().getAttribute('href')).toBe('/session/$group/$individual/$evaluation/history');
      const params = JSON.parse(firstLink.element().getAttribute('data-params') ?? '{}');
      expect(params).toEqual({ group: 'GroupA', individual: 'ClientB', evaluation: 'Eval1' });
    });

    it('"Summarize Session Data" links to view route', async () => {
      renderPage({ ...defaultProps });
      const firstLink = page.getByRole('link', { name: /summarize session data/i }).nth(0);
      await expect.element(firstLink).toBeVisible();
      expect(firstLink.element().getAttribute('href')).toBe('/session/$group/$individual/$evaluation/view');
    });

    it('"Analyze Frequency Data" links to rate route', async () => {
      renderPage({ ...defaultProps });
      const firstLink = page.getByRole('link', { name: /analyze frequency data/i }).nth(0);
      await expect.element(firstLink).toBeVisible();
      expect(firstLink.element().getAttribute('href')).toBe('/session/$group/$individual/$evaluation/rate');
    });

    it('"Analyze Duration Data" links to proportion route', async () => {
      renderPage({ ...defaultProps });
      const firstLink = page.getByRole('link', { name: /analyze duration data/i }).nth(0);
      await expect.element(firstLink).toBeVisible();
      expect(firstLink.element().getAttribute('href')).toBe('/session/$group/$individual/$evaluation/proportion');
    });

    it('"Calculate Reliability" links to reli route', async () => {
      renderPage({ ...defaultProps });
      const firstLink = page.getByRole('link', { name: /calculate reliability/i }).nth(0);
      await expect.element(firstLink).toBeVisible();
      expect(firstLink.element().getAttribute('href')).toBe('/session/$group/$individual/$evaluation/reli');
    });
  });

  // ---- EnableFileDeletion ----

  describe('EnableFileDeletion', () => {
    it('hides Duplicate and Rename items when EnableFileDeletion is false', async () => {
      renderPage({ ...defaultProps });
      await expect.element(page.getByText('Duplicate Evaluation')).not.toBeInTheDocument();
      await expect.element(page.getByText('Rename Evaluation')).not.toBeInTheDocument();
    });

    it('shows Duplicate and Rename items for each row when EnableFileDeletion is true', async () => {
      renderPage({ ...propsWithDeletion });
      await expect.element(page.getByText('Duplicate Evaluation')).toHaveLength(2);
      await expect.element(page.getByText('Rename Evaluation')).toHaveLength(2);
    });
  });

  // ---- Create evaluation ----

  describe('Create evaluation', () => {
    it('does nothing when the prompt is cancelled', async () => {
      promptSpy.mockReturnValue(null);
      renderPage({ ...defaultProps });
      await page.getByRole('button', { name: /create/i }).click();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('does nothing when the entered name is shorter than 4 characters', async () => {
      promptSpy.mockReturnValue('abc');
      renderPage({ ...defaultProps });
      await page.getByRole('button', { name: /create/i }).click();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('alerts and does not call mutation when evaluation already exists', async () => {
      promptSpy.mockReturnValue('Eval1');
      renderPage({ ...defaultProps });
      await page.getByRole('button', { name: /create/i }).click();
      expect(alertSpy).toHaveBeenCalledWith('Evaluation already exists.');
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutation with Add action for a valid new name', async () => {
      promptSpy.mockReturnValue('BrandNewEval');
      renderPage({ ...defaultProps });
      await page.getByRole('button', { name: /create/i }).click();
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

  // ---- Delete evaluations ----

  describe('Delete evaluations', () => {
    it('does nothing when the user cancels the confirmation', async () => {
      confirmSpy.mockReturnValue(false);
      renderPage({ ...defaultProps });
      await page.getByTestId('delete-trigger').click();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutation with Delete action for all rows when confirmed', async () => {
      confirmSpy.mockReturnValue(true);
      renderPage({ ...defaultProps });
      await page.getByTestId('delete-trigger').click();
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

  // ---- Duplicate evaluation ----

  describe('Duplicate evaluation', () => {
    it('does nothing when the prompt is cancelled', async () => {
      promptSpy.mockReturnValue(null);
      renderPage({ ...propsWithDeletion });
      await page
        .getByRole('menuitem', { name: /duplicate evaluation/i })
        .first()
        .click();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('does nothing when the entered name is shorter than 4 characters', async () => {
      promptSpy.mockReturnValue('ab');
      renderPage({ ...propsWithDeletion });
      await page
        .getByRole('menuitem', { name: /duplicate evaluation/i })
        .first()
        .click();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutation with Duplicate action for a valid name', async () => {
      promptSpy.mockReturnValue('Eval1_Copy');
      renderPage({ ...propsWithDeletion });
      await page
        .getByRole('menuitem', { name: /duplicate evaluation/i })
        .first()
        .click();
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

  // ---- Rename evaluation ----

  describe('Rename evaluation', () => {
    it('does nothing when the prompt is cancelled', async () => {
      promptSpy.mockReturnValue(null);
      renderPage({ ...propsWithDeletion });
      await page
        .getByRole('menuitem', { name: /rename evaluation/i })
        .first()
        .click();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('does nothing when the entered name is shorter than 4 characters', async () => {
      promptSpy.mockReturnValue('ab');
      renderPage({ ...propsWithDeletion });
      await page
        .getByRole('menuitem', { name: /rename evaluation/i })
        .first()
        .click();
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutation with Rename action for a valid name', async () => {
      promptSpy.mockReturnValue('RenamedEvaluation');
      renderPage({ ...propsWithDeletion });
      await page
        .getByRole('menuitem', { name: /rename evaluation/i })
        .first()
        .click();
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
