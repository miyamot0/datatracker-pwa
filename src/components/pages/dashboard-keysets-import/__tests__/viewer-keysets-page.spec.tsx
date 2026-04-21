import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockSetQueryData = vi.hoisted(() => vi.fn());
const mockInvalidateQueries = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRouterInvalidate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockToastPromise = vi.hoisted(() =>
  vi.fn(async (fn: () => Promise<unknown>, options?: { success?: () => string; error?: (e: Error) => string }) => {
    const result = await fn();
    options?.success?.();
    options?.error?.(new Error('import failed'));
    return result;
  }),
);

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
  useRouter: () => ({ invalidate: mockRouterInvalidate }),
  useRouterState: () => ({ matches: [{ routeId: '/keyset-import' }] }),
}));

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: any) => <span>{title}</span>,
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({ columns, data, callback, customCheckboxButton, filterCol }: any) => (
    <div>
      <div data-testid="filter-col">{filterCol}</div>
      <div>{columns[0].header({ column: { id: 'Group' } })}</div>
      <div>{columns[1].header({ column: { id: 'Individual' } })}</div>
      <div>{columns[2].header({ column: { id: 'Name' } })}</div>
      <div>{columns[3].header({ column: { id: 'DurationKeys' } })}</div>
      <div>{columns[4].header({ column: { id: 'FrequencyKeys' } })}</div>
      {data.map((row: any, i: number) => (
        <div key={i} data-testid="keyset-import-row">
          <span>{row.Group}</span>
          <span>{row.Individual}</span>
          <span>{row.Name}</span>
          <span>{row.DurationKeys}</span>
          <span>{row.FrequencyKeys}</span>
        </div>
      ))}
      <button onClick={() => callback(data)}>Trigger Import Callback</button>
      <div data-testid="checkbox-button">{customCheckboxButton}</div>
    </div>
  ),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <div>Back</div>,
}));

vi.mock('sonner', () => ({
  toast: {
    promise: mockToastPromise,
  },
}));

import ViewerKeysetPage from '../viewer-keysets-page';

const keysets = [
  {
    Group: 'G2',
    Individual: 'OtherClient',
    Name: 'KeysetAlpha',
    DurationKeys: [{ KeyDescription: 'Waiting', KeyName: 'w' }],
    FrequencyKeys: [{ KeyDescription: 'Aggression', KeyName: 'a' }],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
  },
] as any;

const renderPage = () =>
  render(
    <ViewerKeysetPage
      Group="GroupA"
      Individual="ClientB"
      Handle={{} as FileSystemDirectoryHandle}
      Keysets={keysets}
      Settings={{} as any}
    />,
  );

describe('ViewerKeysetPage', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue([]);
    mockSetQueryData.mockReset();
    mockInvalidateQueries.mockReset();
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
    mockRouterInvalidate.mockImplementation(async (options?: { filter?: (match: { routeId: string }) => boolean }) => {
      options?.filter?.({ routeId: '/keyset-import' });
      options?.filter?.({ routeId: '/session/$group/$individual/keysets/' });
      options?.filter?.({ routeId: '/other' });
    });
    mockToastPromise.mockClear();
  });

  it('renders headings, import button, and remapped key strings', async () => {
    await renderPage();

    await expect.element(page.getByText('Keyset Import')).toBeInTheDocument();
    await expect.element(page.getByText('Import a keyset file to use in your evaluations.')).toBeInTheDocument();
    await expect.element(page.getByText('Group')).toBeInTheDocument();
    await expect.element(page.getByText('Individual')).toBeInTheDocument();
    await expect.element(page.getByText('KeySet Name')).toBeInTheDocument();
    await expect.element(page.getByText('Duration Keys')).toBeInTheDocument();
    await expect.element(page.getByText('Frequency Keys')).toBeInTheDocument();
    await expect.element(page.getByText('Import KeySet(s)')).toBeInTheDocument();
    await expect.element(page.getByText('Waiting (W)')).toBeInTheDocument();
    await expect.element(page.getByText('Aggression (A)')).toBeInTheDocument();
    await expect.element(page.getByTestId('filter-col')).toHaveTextContent('Name');
  });

  it('imports selected keysets through callback and runs onSuccess cache invalidation', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Trigger Import Callback' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Group: 'GroupA',
        Individual: 'ClientB',
        KeySets: expect.arrayContaining([expect.objectContaining({ Name: 'KeysetAlpha' })]),
      }),
    );
    expect(mockSetQueryData).toHaveBeenCalledWith(['/', 'GroupA', 'metaKeyboards'], []);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/', 'GroupA', 'ClientB', 'keyboards'] });
    expect(mockRouterInvalidate).toHaveBeenCalled();
  });
});
