import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockSetQueryData = vi.hoisted(() => vi.fn());
const mockInvalidateQueries = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockRouterInvalidate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockToastPromise = vi.hoisted(() =>
  vi.fn(async (fn: () => Promise<unknown>, options?: { success?: () => string; error?: () => string }) => {
    const result = await fn();
    options?.success?.();
    options?.error?.();
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
  useRouterState: () => ({ matches: [{ routeId: '/eval-import' }] }),
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
      <div>{columns[2].header({ column: { id: 'Evaluation' } })}</div>
      <div>{columns[3].header({ column: { id: 'Conditions' } })}</div>
      {data.map((row: any, i: number) => (
        <div key={i} data-testid="eval-import-row">
          <span>{row.Group}</span>
          <span>{row.Individual}</span>
          <span>{row.Evaluation}</span>
          {columns[3].cell({ row: { original: row } })}
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

import ViewerEvaluationsPage from '../viewer-evaluations-page';

const evaluations = [
  { Group: 'G1', Individual: 'ClientB', Evaluation: 'EvalA', Conditions: ['Baseline', 'Treatment'] },
  { Group: 'G2', Individual: 'OtherClient', Evaluation: 'EvalA', Conditions: ['Generalization'] },
  { Group: 'G2', Individual: 'OtherClient', Evaluation: 'EvalB', Conditions: undefined },
  { Group: 'G3', Individual: 'OtherClient', Evaluation: 'EvalC', Conditions: ['Probe'] },
] as any;

const renderPage = () =>
  render(
    <ViewerEvaluationsPage
      Group="GroupA"
      Individual="ClientB"
      Handle={{} as FileSystemDirectoryHandle}
      Settings={{} as any}
      Evaluations={evaluations}
    />,
  );

describe('ViewerEvaluationsPage', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue([]);
    mockSetQueryData.mockReset();
    mockInvalidateQueries.mockReset();
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
    mockRouterInvalidate.mockImplementation(async (options?: { filter?: (match: { routeId: string }) => boolean }) => {
      options?.filter?.({ routeId: '/eval-import' });
      options?.filter?.({ routeId: '/session/$group/$individual/' });
      options?.filter?.({ routeId: '/other' });
    });
    mockToastPromise.mockClear();
  });

  it('renders import page text, table headers, and custom checkbox content', async () => {
    await renderPage();

    await expect.element(page.getByText('Prior Evaluation Import')).toBeInTheDocument();
    await expect.element(page.getByText('Import Existing Evaluations/Conditions')).toBeInTheDocument();
    await expect.element(page.getByText('Group')).toBeInTheDocument();
    await expect.element(page.getByText('Individual')).toBeInTheDocument();
    await expect.element(page.getByText('Conditions', { exact: true })).toBeInTheDocument();
    await expect.element(page.getByText('Import Evaluation(s)')).toBeInTheDocument();
    await expect.element(page.getByTestId('filter-col')).toHaveTextContent('Evaluation');
  });

  it('filters out current individual evaluations and duplicate evaluation names', async () => {
    await renderPage();

    expect(await page.getByText('ClientB').query()).toBeNull();
    expect(await page.getByText('EvalA').query()).toBeNull();
    await expect.element(page.getByText('EvalB')).toBeInTheDocument();
    await expect.element(page.getByText('EvalC')).toBeInTheDocument();
  });

  it('imports selected rows through mutation callback', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Trigger Import Callback' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Import',
        Group: 'GroupA',
        Individual: 'ClientB',
        RelevantRecords: expect.arrayContaining([
          expect.objectContaining({ Evaluation: 'EvalB' }),
          expect.objectContaining({ Evaluation: 'EvalC' }),
        ]),
      }),
    );
    expect(mockSetQueryData).toHaveBeenCalledWith(['/', 'metaEvaluations'], []);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['/', 'GroupA', 'ClientB'] });
    expect(mockRouterInvalidate).toHaveBeenCalled();
  });
});
