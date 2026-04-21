import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockRouterInvalidate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockSetQueryData = vi.hoisted(() => vi.fn());
const mockInvalidateQueries = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockToastPromise = vi.hoisted(() =>
  vi.fn(async (fn: () => Promise<unknown>, options?: { success?: () => string; error?: (e: Error) => string }) => {
    const result = await fn();
    options?.success?.();
    options?.error?.(new Error('mock error'));
    return result;
  }),
);
const mockAlert = vi.hoisted(() => vi.fn());

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: mockSetQueryData,
    invalidateQueries: mockInvalidateQueries,
  },
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(({ onSuccess }: { onSuccess?: (data: unknown) => Promise<void> | void }) => ({
    mutateAsync: async (payload: unknown) => {
      const data = await mockMutateAsync(payload);
      if (onSuccess) {
        await onSuccess(data);
      }
      return data;
    },
  })),
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, params, children, className }: any) => (
    <a href={to} data-params={params ? JSON.stringify(params) : undefined} className={className}>
      {children}
    </a>
  ),
  useRouter: () => ({ invalidate: mockRouterInvalidate }),
  useRouterState: () => ({ matches: [{ routeId: '/current' }] }),
}));

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: any) => <span>{title}</span>,
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({ columns, data, callback, optionalButtons, filterCol }: any) => (
    <div>
      <div data-testid="filter-col">{filterCol}</div>
      <div data-testid="table-head">{columns[0].header({ column: { id: 'Evaluation' } })}</div>
      <div data-testid="table-action-head">{columns[1].header()}</div>
      {data.map((item: any, i: number) => (
        <div key={i} data-testid="eval-row">
          <span>{item.Evaluation}</span>
          {columns[1].cell({ row: { original: item } })}
        </div>
      ))}
      <button
        onClick={() => {
          callback(data);
        }}
      >
        Trigger Delete Callback
      </button>
      {optionalButtons}
    </div>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

vi.mock('@/components/ui/tooltip-wrapper', () => ({
  default: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <div>Back</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    promise: mockToastPromise,
  },
}));

import EvaluationsPage from '../evaluations-page';

const makeSettings = (enableDeletion = true) =>
  ({
    EnableFileDeletion: enableDeletion,
  }) as any;

const renderPage = (enableDeletion = true) =>
  render(
    <EvaluationsPage
      Group="GroupA"
      Individual="ClientB"
      Evaluations={['EvalOne', 'EvalTwo']}
      Settings={makeSettings(enableDeletion)}
      Handle={{} as FileSystemDirectoryHandle}
    />,
  );

describe('EvaluationsPage', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue([]);
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
    mockRouterInvalidate.mockImplementation(async (options?: { filter?: (match: { routeId: string }) => boolean }) => {
      options?.filter?.({ routeId: '/current' });
      options?.filter?.({ routeId: '/session/$group/$individual/import' });
    });
    mockSetQueryData.mockReset();
    mockInvalidateQueries.mockReset();
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockToastPromise.mockClear();
    mockAlert.mockReset();

    vi.stubGlobal('alert', mockAlert);
  });

  it('renders headings, table headers, and action links', async () => {
    await renderPage(true);

    await expect.element(page.getByText('Evaluation Directory: ClientB')).toBeInTheDocument();
    await expect.element(page.getByText('Select Evaluation to Build Session')).toBeInTheDocument();
    await expect.element(page.getByTestId('table-head').getByText('Evaluation')).toBeInTheDocument();
    await expect.element(page.getByText('Evaluation Folder Actions')).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Record Sessions' }).first()).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Review Session Data' }).first()).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Summarize Session Data' }).first()).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Analyze Frequency Data' }).first()).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Analyze Duration Data' }).first()).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Calculate Reliability' }).first()).toBeInTheDocument();
  });

  it('hides duplicate and rename actions when file deletion is disabled', async () => {
    await renderPage(false);

    expect(await page.getByRole('button', { name: 'Duplicate Evaluation' }).query()).toBeNull();
    expect(await page.getByRole('button', { name: 'Rename Evaluation' }).query()).toBeNull();
  });

  it('delete callback returns early when confirmation is false', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false),
    );
    await renderPage(true);

    await page.getByRole('button', { name: 'Trigger Delete Callback' }).click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('delete callback mutates when confirmation is true', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    await renderPage(true);

    await page.getByRole('button', { name: 'Trigger Delete Callback' }).click();

    expect(mockToastPromise).toHaveBeenCalled();
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Delete',
        Group: 'GroupA',
        Individual: 'ClientB',
        Evaluations: ['EvalOne', 'EvalTwo'],
      }),
    );
    expect(mockSetQueryData).toHaveBeenCalled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/', 'metaEvaluations'] });
    expect(mockRouterInvalidate).toHaveBeenCalled();
  });

  it('create button returns when prompt is canceled', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => null),
    );
    await renderPage(true);

    await page.getByRole('button', { name: 'Create' }).click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('create button blocks duplicate and too-short names', async () => {
    const prompt = vi.fn().mockReturnValueOnce('EvalOne').mockReturnValueOnce('abc');
    vi.stubGlobal('prompt', prompt);

    await renderPage(true);

    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByRole('button', { name: 'Create' }).click();

    expect(mockAlert).toHaveBeenNthCalledWith(1, 'Evaluation already exists.');
    expect(mockAlert).toHaveBeenNthCalledWith(2, 'Evaluation name must be at least 4 characters long.');
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('create button adds a valid evaluation', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => '  NewEvaluation  '),
    );
    await renderPage(true);

    await page.getByRole('button', { name: 'Create' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Add',
        Evaluations: ['NewEvaluation'],
      }),
    );
  });

  it('duplicate and rename actions return early for null and short names', async () => {
    const prompt = vi
      .fn()
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('abc')
      .mockReturnValueOnce(null)
      .mockReturnValueOnce('ab');
    vi.stubGlobal('prompt', prompt);

    await renderPage(true);

    const duplicateBtn = page.getByText('Duplicate Evaluation').first();
    const renameBtn = page.getByText('Rename Evaluation').first();

    await duplicateBtn.click();
    await duplicateBtn.click();
    await renameBtn.click();
    await renameBtn.click();

    expect(mockMutateAsync).not.toHaveBeenCalledWith(expect.objectContaining({ Action: 'Duplicate' }));
    expect(mockMutateAsync).not.toHaveBeenCalledWith(expect.objectContaining({ Action: 'Rename' }));
  });

  it('duplicate action mutates for valid input', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => 'EvalCopy'),
    );
    await renderPage(true);

    await page.getByText('Duplicate Evaluation').first().click();

    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ Action: 'Duplicate', Rename: 'EvalCopy' }),
      );
    });
  });

  it('rename action mutates for valid input', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => 'EvalRenamed'),
    );
    await renderPage(true);

    await page.getByText('Rename Evaluation').first().click();

    await vi.waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({ Action: 'Rename', Rename: 'EvalRenamed' }),
      );
    });
  });
});
