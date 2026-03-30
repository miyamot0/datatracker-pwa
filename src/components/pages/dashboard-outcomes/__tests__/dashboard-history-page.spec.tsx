import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMutateAsync = vi.hoisted(() => vi.fn());
const mockSetQueryData = vi.hoisted(() => vi.fn());
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
  },
}));

vi.mock('@/lib/writer', () => ({
  GenerateSavedFileName: (settings: any) => `session-${settings.Session}.json`,
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
  useRouterState: () => ({ matches: [{ routeId: '/history' }] }),
}));

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: any) => <span>{title}</span>,
}));

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({ data, columns, callback, callback2, customCheckboxButton2 }: any) => (
    <div>
      <div>{columns[0].header({ column: { id: 'Session' } })}</div>
      <div>{columns[1].header({ column: { id: 'Data Collector' } })}</div>
      <div>{columns[2].header({ column: { id: 'Condition' } })}</div>
      <div>{columns[3].header({ column: { id: 'Total Duration' } })}</div>
      <div>{columns[4].header({ column: { id: 'Date Recorded' } })}</div>
      <div>{columns[5].header()}</div>

      {data.map((row: any, i: number) => (
        <div key={i} data-testid="session-row">
          {columns[0].cell({ row: { original: row } })}
          <div data-testid={`collector-${i}`}>{row.SessionSettings.Initials}</div>
          <div data-testid={`condition-${i}`}>{row.SessionSettings.Condition}</div>
          {columns[3].cell({ row: { original: row } })}
          {columns[4].cell({ row: { original: row } })}
          {columns[5].cell({ row: { original: row } })}
        </div>
      ))}

      <button onClick={() => callback(data)}>Trigger Delete Callback</button>
      <button onClick={() => callback2(data)}>Trigger Rename Callback</button>
      <div data-testid="rename-button-slot">{customCheckboxButton2}</div>
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

import DashboardHistoryPage from '../dashboard-history-page';

const makeSession = (session: number, role: 'Primary' | 'Reliability') =>
  ({
    SessionSettings: {
      Session: session,
      Role: role,
      Initials: role === 'Primary' ? 'AA' : 'BB',
      Condition: role === 'Primary' ? 'Baseline' : 'Intervention',
      TimerOption: 'End on Timer #1',
      DurationS: 600,
      KeySet: 'KeysetA',
      Therapist: 'Therapist',
    },
    TimerMain: role === 'Primary' ? 10.25 : 14.5,
    SessionEnd: new Date('2024-01-01T00:00:00Z').toISOString(),
  }) as any;

const renderPage = (enableDeletion = true) =>
  render(
    <DashboardHistoryPage
      Group="GroupA"
      Individual="ClientB"
      Evaluation="Eval1"
      Sessions={[makeSession(1, 'Primary'), makeSession(2, 'Reliability')]}
      Settings={{ EnableFileDeletion: enableDeletion } as any}
      Handle={{} as FileSystemDirectoryHandle}
    />,
  );

describe('DashboardHistoryPage', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue([]);
    mockSetQueryData.mockReset();
    mockRouterInvalidate.mockReset();
    mockRouterInvalidate.mockResolvedValue(undefined);
    mockRouterInvalidate.mockImplementation(async (options?: { filter?: (match: { routeId: string }) => boolean }) => {
      options?.filter?.({ routeId: '/history' });
      options?.filter?.({ routeId: '/session/$group/$individual/$evaluation/' });
    });
    mockToastPromise.mockClear();
  });

  it('renders summary content, table headers, and action links', async () => {
    await renderPage(true);

    await expect.element(page.getByText('Session History (Eval1)')).toBeInTheDocument();
    await expect.element(page.getByText('Select Individual Sessions to View More')).toBeInTheDocument();
    await expect.element(page.getByText('Session', { exact: true })).toBeInTheDocument();
    await expect.element(page.getByText('Data Collector')).toBeInTheDocument();
    await expect.element(page.getByText('Condition', { exact: true })).toBeInTheDocument();
    await expect.element(page.getByText('Total Duration')).toBeInTheDocument();
    await expect.element(page.getByText('Date Recorded')).toBeInTheDocument();
    await expect.element(page.getByText('Actions')).toBeInTheDocument();

    await expect.element(page.getByRole('link', { name: 'View' }).first()).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'Edit' }).first()).toBeInTheDocument();
  });

  it('hides edit links when file deletion setting is disabled', async () => {
    await renderPage(false);

    expect(await page.getByRole('link', { name: 'Edit' }).query()).toBeNull();
  });

  it('renders role badges and formatted timer/date cells', async () => {
    await renderPage(true);

    await expect.element(page.getByText('Primary')).toBeInTheDocument();
    await expect.element(page.getByText('Reliability')).toBeInTheDocument();
    await expect.element(page.getByText('10.25')).toBeInTheDocument();
    await expect.element(page.getByText('14.50')).toBeInTheDocument();
  });

  it('delete callback returns when confirmation is false', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => false),
    );
    await renderPage(true);

    await page.getByRole('button', { name: 'Trigger Delete Callback' }).click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('delete callback mutates selected rows when confirmed', async () => {
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true),
    );
    await renderPage(true);

    await page.getByRole('button', { name: 'Trigger Delete Callback' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Delete',
        Group: 'GroupA',
        Individual: 'ClientB',
        Evaluation: 'Eval1',
      }),
    );
    expect(mockSetQueryData).toHaveBeenCalled();
    expect(mockRouterInvalidate).toHaveBeenCalled();
  });

  it('rename callback returns early on null and short prompt values', async () => {
    vi.stubGlobal('prompt', vi.fn().mockReturnValueOnce(null).mockReturnValueOnce('ab'));
    await renderPage(true);

    await page.getByRole('button', { name: 'Trigger Rename Callback' }).click();
    await page.getByRole('button', { name: 'Trigger Rename Callback' }).click();

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('rename callback updates condition when prompt is valid', async () => {
    vi.stubGlobal(
      'prompt',
      vi.fn(() => 'New Condition'),
    );
    await renderPage(true);

    await page.getByRole('button', { name: 'Trigger Rename Callback' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'EditCondition',
        ConditionRename: 'New Condition',
      }),
    );

    await expect.element(page.getByTestId('rename-button-slot')).toHaveTextContent('Rename Conditions');
  });
});
