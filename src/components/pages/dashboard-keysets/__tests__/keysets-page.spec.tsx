import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockRouterInvalidate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockSetQueryData = vi.hoisted(() => vi.fn());
const mockInvalidateQueries = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockToastPromise = vi.hoisted(() =>
  vi.fn(async (fn: () => Promise<unknown>, options?: { success?: () => string; error?: () => string }) => {
    const result = await fn();
    options?.success?.();
    options?.error?.();
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
  useRouterState: () => ({ matches: [{ routeId: '/keysets' }] }),
}));

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: any) => <span>{title}</span>,
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({ columns, data, callback, optionalButtons, filterCol }: any) => (
    <div>
      <div data-testid="filter-col">{filterCol}</div>
      <div>{columns[0].header({ column: { id: 'Name' } })}</div>
      <div>{columns[1].header({ column: { id: 'FrequencyKeys' } })}</div>
      <div>{columns[2].header({ column: { id: 'DurationKeys' } })}</div>
      <div>{columns[3].header({ column: { id: 'createdAt' } })}</div>
      <div>{columns[4].header()}</div>
      {data.map((item: any, i: number) => (
        <div key={i} data-testid="keyset-row">
          <span>{item.Name}</span>
          {columns[1].cell({ row: { original: item } })}
          {columns[2].cell({ row: { original: item } })}
          {columns[3].cell({ row: { original: item } })}
          {columns[4].cell({ row: { original: item } })}
        </div>
      ))}
      <button onClick={() => callback(data)}>Trigger Delete Callback</button>
      {optionalButtons}
    </div>
  ),
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

import KeySetsPage from '../keysets-page';

const makeSettings = () => ({ EnableFileDeletion: true }) as any;

const keysets = [
  {
    Name: 'StarterSet',
    createdAt: '2024-01-01T00:00:00.000Z',
    FrequencyKeys: [{ KeyDescription: 'Aggression', KeyName: 'a' }],
    DurationKeys: [{ KeyDescription: 'Task Refusal', KeyName: 'r' }],
  },
] as any;

const renderPage = () =>
  render(
    <KeySetsPage
      Group="GroupA"
      Individual="ClientB"
      KeySets={keysets}
      Settings={makeSettings()}
      Handle={{} as FileSystemDirectoryHandle}
    />,
  );

describe('KeySetsPage', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue([]);
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
    mockRouterInvalidate.mockImplementation(async (options?: { filter?: (match: { routeId: string }) => boolean }) => {
      options?.filter?.({ routeId: '/keysets' });
      options?.filter?.({ routeId: '/session/$group/$individual/keysets/import' });
    });
    mockSetQueryData.mockReset();
    mockInvalidateQueries.mockReset();
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockToastPromise.mockClear();
    mockAlert.mockReset();

    vi.stubGlobal('alert', mockAlert);
  });

  it('renders keyset headers, mapped key names, and edit/import links', async () => {
    await renderPage();

    await expect.element(page.getByText('Keyset Directory: ClientB')).toBeInTheDocument();
    await expect.element(page.getByText('Create or Edit Current Keysets')).toBeInTheDocument();
    await expect.element(page.getByText('Keyset Name')).toBeInTheDocument();
    await expect.element(page.getByText('Frequency Keys')).toBeInTheDocument();
    await expect.element(page.getByText('Duration Keys')).toBeInTheDocument();
    await expect.element(page.getByText('Date Created')).toBeInTheDocument();
    await expect.element(page.getByText('Aggression (A)')).toBeInTheDocument();
    await expect.element(page.getByText('Task Refusal (R)')).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Edit' })).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Import' })).toBeInTheDocument();
    await expect.element(page.getByTestId('filter-col')).toHaveTextContent('Name');
  });

  it('delete callback returns early when confirmation is false', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false),
    );
    await renderPage();

    await page.getByRole('button', { name: 'Trigger Delete Callback' }).click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('delete callback mutates selected keysets when confirmed', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    await renderPage();

    await page.getByRole('button', { name: 'Trigger Delete Callback' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Delete',
        Group: 'GroupA',
        Individual: 'ClientB',
        Keysets: ['StarterSet'],
      }),
    );
    expect(mockSetQueryData).toHaveBeenCalled();
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/', 'GroupA', 'metaKeyboards'] });
    expect(mockRouterInvalidate).toHaveBeenCalled();
  });

  it('duplicate action returns early for null and short names', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValueOnce(null).mockReturnValueOnce('ab'));
    await renderPage();

    const duplicate = page.getByRole('button', { name: 'Duplicate' });
    await duplicate.click();
    await duplicate.click();

    expect(mockMutateAsync).not.toHaveBeenCalledWith(expect.objectContaining({ Action: 'Duplicate' }));
  });

  it('duplicate action mutates with trimmed rename on valid prompt', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => '  StarterCopy  '),
    );
    await renderPage();

    await page.getByRole('button', { name: 'Duplicate' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Duplicate',
        Keysets: ['StarterSet'],
        Rename: 'StarterCopy',
      }),
    );
  });

  it('create action returns early when prompt is canceled', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => null),
    );
    await renderPage();

    await page.getByRole('button', { name: 'Create' }).click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('create action blocks short and duplicate names', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValueOnce('ab').mockReturnValueOnce('StarterSet'));
    await renderPage();

    await page.getByRole('button', { name: 'Create' }).click();
    await page.getByRole('button', { name: 'Create' }).click();

    expect(mockAlert).toHaveBeenNthCalledWith(1, 'Keyset name must be at least 4 characters long');
    expect(mockAlert).toHaveBeenNthCalledWith(
      2,
      'A keyset with this name already exists. Please choose a different name.',
    );
    expect(mockMutateAsync).not.toHaveBeenCalledWith(expect.objectContaining({ Action: 'Add' }));
  });

  it('create action adds keyset with trimmed name', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => '  NewSet  '),
    );
    await renderPage();

    await page.getByRole('button', { name: 'Create' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Add',
        Group: 'GroupA',
        Individual: 'ClientB',
        Keysets: ['NewSet'],
      }),
    );
  });
});
