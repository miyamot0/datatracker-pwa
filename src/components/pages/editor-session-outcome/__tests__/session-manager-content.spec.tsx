import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockSetQueryData = vi.hoisted(() => vi.fn());
const mockInvalidate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockConfirm = vi.hoisted(() => vi.fn());
const mockPrompt = vi.hoisted(() => vi.fn());
const mockAlert = vi.hoisted(() => vi.fn());
const mockToastPromise = vi.hoisted(() => vi.fn(async (fn: () => Promise<unknown>) => await fn()));

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: mockSetQueryData,
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
  useRouter: () => ({ invalidate: mockInvalidate }),
  useRouterState: () => ({ matches: [{ routeId: '/test' }] }),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <div>Back</div>,
}));

vi.mock('@/components/ui/tooltip-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('sonner', () => ({
  toast: {
    promise: mockToastPromise,
  },
}));

import SessionManagerContent from '../session-manager-content';

const makeSession = () =>
  ({
    Filename: 'session-1.json',
    SessionStart: '2025-01-01T12:00:00.000Z',
    Comments: 'Initial comment',
    SessionSettings: {
      Session: 3,
      Condition: 'Baseline',
    },
    Keyset: {
      FrequencyKeys: [
        { KeyName: 'FREQ_A', KeyDescription: 'Freq A', KeyCode: 65 },
        { KeyName: 'FREQ_B', KeyDescription: 'Freq B', KeyCode: 66 },
      ],
      DurationKeys: [{ KeyName: 'DUR_A', KeyDescription: 'Dur A', KeyCode: 67 }],
    },
  }) as any;

const makeSavedKeys = () =>
  [
    {
      KeyType: 'System',
      KeyDescription: 'System Event',
      KeyName: 'SYS',
      TimePressed: '2025-01-01T12:00:01.000Z',
      TimeIntoSession: 1.2,
      KeyCode: 1,
    },
    {
      KeyType: 'Frequency',
      KeyDescription: 'Freq A',
      KeyName: 'FREQ_A',
      TimePressed: '2025-01-01T12:00:02.000Z',
      TimeIntoSession: 2.3,
      KeyCode: 65,
    },
    {
      KeyType: 'Duration',
      KeyDescription: 'Dur A',
      KeyName: 'DUR_A',
      TimePressed: '2025-01-01T12:00:03.000Z',
      TimeIntoSession: 3.4,
      KeyCode: 67,
    },
    {
      KeyType: 'Timing',
      KeyDescription: 'Timing Event',
      KeyName: 'TIM',
      TimePressed: '2025-01-01T12:00:04.000Z',
      TimeIntoSession: 4.5,
      KeyCode: 99,
    },
  ] as any[];

const renderSessionManager = () =>
  render(
    <SessionManagerContent
      Group="GroupA"
      Individual="ClientB"
      Evaluation="Eval1"
      Session={makeSession()}
      SavedKeys={makeSavedKeys()}
      Handle={{} as FileSystemDirectoryHandle}
    />,
  );

describe('SessionManagerContent', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockSetQueryData.mockReset();
    mockInvalidate.mockReset();
    mockConfirm.mockReset();
    mockPrompt.mockReset();
    mockAlert.mockReset();
    mockToastPromise.mockClear();

    mockConfirm.mockReturnValue(true);
    vi.stubGlobal('confirm', mockConfirm);
    vi.stubGlobal('prompt', mockPrompt);
    vi.stubGlobal('alert', mockAlert);
  });

  it('renders metadata and action controls', async () => {
    await renderSessionManager();

    await expect.element(page.getByText('Session Record Manager (session-1.json)')).toBeInTheDocument();
    await expect.element(page.getByText('Condition:')).toBeInTheDocument();
    await expect.element(page.getByText('Comments:')).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Update File' })).toBeInTheDocument();
  });

  it('renders rows for all key types to exercise color branches', async () => {
    await renderSessionManager();

    await expect.element(page.getByText('System Event')).toBeInTheDocument();
    await expect.element(page.getByText('Freq A')).toBeInTheDocument();
    await expect.element(page.getByText('Dur A')).toBeInTheDocument();
    await expect.element(page.getByText('Timing Event')).toBeInTheDocument();

    const deleteButtons = await page.getByRole('button', { name: 'Delete Key' }).all();
    expect(deleteButtons).toHaveLength(4);

    const replaceButtons = await page.getByRole('button', { name: 'Replace Key' }).all();
    await expect.element(deleteButtons[0]).toBeDisabled();
    await expect.element(deleteButtons[3]).toBeDisabled();
    await expect.element(replaceButtons[0]).toBeDisabled();
    await expect.element(replaceButtons[3]).toBeDisabled();
  });

  it('cancels delete when not confirmed', async () => {
    mockConfirm.mockReturnValue(false);
    await renderSessionManager();

    await page.getByRole('button', { name: 'Delete Key' }).nth(1).click();

    await expect.element(page.getByText('Freq A')).toBeInTheDocument();
  });

  it('deletes a key row when confirmed', async () => {
    await renderSessionManager();

    await page.getByRole('button', { name: 'Delete Key' }).nth(1).click();

    const keyLabels = await page.getByText('Freq A').all();
    expect(keyLabels.length).toBe(0);
  });

  it('handles replace key prompt cancellation', async () => {
    mockPrompt.mockReturnValue(null);
    await renderSessionManager();

    await page.getByRole('button', { name: 'Replace Key' }).nth(1).click();

    await expect.element(page.getByText('FREQ_A')).toBeInTheDocument();
  });

  it('alerts for invalid replacement key', async () => {
    mockPrompt.mockReturnValue('NOT_A_KEY');
    await renderSessionManager();

    await page.getByRole('button', { name: 'Replace Key' }).nth(1).click();

    expect(mockAlert).toHaveBeenCalledWith('Invalid key name entered. No changes made.');
  });

  it('replaces a key when a valid key name is entered', async () => {
    mockPrompt.mockReturnValue('FREQ_B');
    await renderSessionManager();

    await page.getByRole('button', { name: 'Replace Key' }).nth(1).click();

    await expect.element(page.getByText('FREQ_B')).toBeInTheDocument();
  });

  it('does not save when update confirmation is canceled', async () => {
    mockConfirm.mockReturnValueOnce(false);
    await renderSessionManager();

    await page.getByRole('button', { name: 'Update File' }).click();

    expect(mockToastPromise).not.toHaveBeenCalled();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('saves updated session with filtered key types and comments', async () => {
    await renderSessionManager();

    const textarea = page.getByRole('textbox');
    await textarea.fill('Updated comments');

    await page.getByRole('button', { name: 'Update File' }).click();

    expect(mockToastPromise).toHaveBeenCalled();
    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Modify',
        Group: 'GroupA',
        Individual: 'ClientB',
        Evaluation: 'Eval1',
        UpdatedOutcome: expect.objectContaining({
          Comments: 'Updated comments',
          FrequencyKeyPresses: expect.arrayContaining([expect.objectContaining({ KeyType: 'Frequency' })]),
          DurationKeyPresses: expect.arrayContaining([expect.objectContaining({ KeyType: 'Duration' })]),
        }),
      }),
    );
    expect(mockSetQueryData).toHaveBeenCalledWith(['/', 'GroupA', 'ClientB', 'Eval1', 'outcomes'], undefined);
    expect(mockInvalidate).toHaveBeenCalledWith(
      expect.objectContaining({
        sync: true,
      }),
    );
    const invalidateConfig = mockInvalidate.mock.calls[0][0];
    expect(invalidateConfig.filter({ routeId: '/test' })).toBe(true);
    expect(invalidateConfig.filter({ routeId: '/other-route' })).toBe(false);
  });

  it('saves with empty comments when comment box is cleared', async () => {
    await renderSessionManager();

    const textarea = page.getByRole('textbox');
    await textarea.fill('');

    await page.getByRole('button', { name: 'Update File' }).click();

    expect(mockMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        UpdatedOutcome: expect.objectContaining({
          Comments: '',
        }),
      }),
    );
  });

  it('exposes success and error toast message handlers for save action', async () => {
    await renderSessionManager();

    await page.getByRole('button', { name: 'Update File' }).click();

    const toastConfig = mockToastPromise.mock.calls[0][1];
    expect(toastConfig.success()).toBe('Session file has been updated successfully!');
    expect(toastConfig.error(new Error('save failed'))).toBe(
      'An error occurred while saving the session file: save failed.',
    );
  });
});
