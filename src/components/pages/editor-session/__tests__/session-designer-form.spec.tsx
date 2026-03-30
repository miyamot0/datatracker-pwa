import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockConditionsMutate = vi.hoisted(() => vi.fn().mockResolvedValue([]));
const mockSettingsMutate = vi.hoisted(() => vi.fn().mockResolvedValue({ KeySet: 'Keyset B' }));
const mockNavigate = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockPreloadRoute = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));
const mockDisplayNotification = vi.hoisted(() => vi.fn());
const mockToastPromise = vi.hoisted(() => vi.fn(async (fn: () => Promise<unknown>) => await fn()));
const mockPrompt = vi.hoisted(() => vi.fn());
const mockConfirm = vi.hoisted(() => vi.fn());
const mockMutationConditionsFn = vi.hoisted(() => vi.fn());
const mockMutationSettingsFn = vi.hoisted(() => vi.fn());

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
  },
}));

vi.mock('@/queries/conditions/mutate-conditions', () => ({
  mutationConditions: mockMutationConditionsFn,
}));

vi.mock('@/queries/session/mutate-session-params', () => ({
  mutationSettingsParams: mockMutationSettingsFn,
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(
    ({ mutationFn, onSuccess }: { mutationFn: unknown; onSuccess?: (data: unknown) => Promise<void> | void }) => {
      if (mutationFn === mockMutationConditionsFn) {
        return {
          mutateAsync: async (payload: unknown) => {
            const data = await mockConditionsMutate(payload);
            if (onSuccess) {
              await onSuccess(data);
            }
            return data;
          },
        };
      }

      if (mutationFn === mockMutationSettingsFn) {
        return {
          mutateAsync: async (payload: unknown) => {
            const data = await mockSettingsMutate(payload);
            if (onSuccess) {
              await onSuccess(data);
            }
            return data;
          },
        };
      }

      return { mutateAsync: vi.fn() };
    },
  ),
}));

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    invalidate: vi.fn().mockResolvedValue(undefined),
    preloadRoute: mockPreloadRoute,
  }),
  useRouterState: () => ({ matches: [{ routeId: '/test' }] }),
  useNavigate: () => mockNavigate,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <div>Back</div>,
}));

vi.mock('@/components/ui/tooltip-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: mockDisplayNotification,
}));

vi.mock('sonner', () => ({
  toast: {
    promise: mockToastPromise,
  },
}));

import SessionDesigner from '../session-designer-form';

const makeKeysets = () =>
  [
    {
      id: 'ksa',
      Name: 'Keyset A',
      FrequencyKeys: [{ KeyDescription: 'F1', KeyName: 'A' }],
      DurationKeys: [{ KeyDescription: 'D1', KeyName: 'B' }],
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
      DerivedKeys: [],
    },
    {
      id: 'ksb',
      Name: 'Keyset B',
      FrequencyKeys: [{ KeyDescription: 'F2', KeyName: 'C' }],
      DurationKeys: [{ KeyDescription: 'D2', KeyName: 'D' }],
      SpecialDurationKeys: [{ KeyDescription: 'Special Time', KeyName: 'T', KeyCode: 555 }],
      ScorableDurationKeys: [{ KeyDescription: 'Scoring Time', KeyName: 'S', KeyCode: 777 }],
      DerivedKeys: [],
    },
  ] as any[];

const makeSettings = (cacheBehavior: 'normal' | 'aggressive' = 'normal') =>
  ({
    ...({} as any),
    CacheBehavior: cacheBehavior,
  }) as any;

const makeSessionSettings = () =>
  ({
    Therapist: 'TH',
    KeySet: 'Keyset A',
    DurationS: 600,
    TimerOption: 1,
    Session: 2,
    Condition: 'Baseline',
    Initials: 'DC',
    Role: 'Primary',
  }) as any;

const renderDesigner = (cacheBehavior: 'normal' | 'aggressive' = 'normal') =>
  render(
    <SessionDesigner
      Group="GroupA"
      Individual="ClientB"
      Evaluation="Eval1"
      Conditions={['Baseline', 'Intervention']}
      Keysets={makeKeysets()}
      SessionSettings={makeSessionSettings()}
      Settings={makeSettings(cacheBehavior)}
      Handle={{} as FileSystemDirectoryHandle}
    />,
  );

describe('SessionDesigner', () => {
  beforeEach(() => {
    mockConditionsMutate.mockReset();
    mockSettingsMutate.mockReset();
    mockNavigate.mockReset();
    mockPreloadRoute.mockReset();
    mockDisplayNotification.mockReset();
    mockToastPromise.mockClear();
    mockPrompt.mockReset();
    mockConfirm.mockReset();

    mockConditionsMutate.mockResolvedValue([]);
    mockSettingsMutate.mockResolvedValue({ KeySet: 'Keyset B' });

    vi.stubGlobal('prompt', mockPrompt);
    vi.stubGlobal('confirm', mockConfirm);
  });

  it('renders session designer sections and fields', async () => {
    await renderDesigner();

    await expect.element(page.getByText('Session Designer')).toBeInTheDocument();
    await expect.element(page.getByText('Frequency Keys')).toBeInTheDocument();
    await expect.element(page.getByText('Duration Keys')).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Run Session' })).toBeInTheDocument();
  });

  it('returns early when add condition prompt is canceled', async () => {
    mockPrompt.mockReturnValue(null);
    await renderDesigner();

    await page.getByRole('button', { name: 'Add New Condition' }).click();

    expect(mockConditionsMutate).not.toHaveBeenCalled();
  });

  it('shows duplicate condition notification', async () => {
    mockPrompt.mockReturnValue('Baseline');
    await renderDesigner();

    await page.getByRole('button', { name: 'Add New Condition' }).click();

    expect(mockDisplayNotification).toHaveBeenCalled();
    expect(mockConditionsMutate).not.toHaveBeenCalled();
  });

  it('adds a new condition via mutation', async () => {
    mockPrompt.mockReturnValue('New Cond');
    await renderDesigner();

    await page.getByRole('button', { name: 'Add New Condition' }).click();

    expect(mockToastPromise).toHaveBeenCalled();
    expect(mockConditionsMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        Action: 'Add',
        Condition: 'New Cond',
      }),
    );
  });

  it('cancels clear empty conditions when user declines', async () => {
    mockConfirm.mockReturnValue(false);
    await renderDesigner();

    await page.getByRole('button', { name: 'Clear Empty Condition(s)' }).click();

    expect(mockConditionsMutate).not.toHaveBeenCalledWith(expect.objectContaining({ Action: 'Clear' }));
  });

  it('clears empty conditions when confirmed', async () => {
    mockConfirm.mockReturnValue(true);
    await renderDesigner();

    await page.getByRole('button', { name: 'Clear Empty Condition(s)' }).click();

    expect(mockToastPromise).toHaveBeenCalled();
    expect(mockConditionsMutate).toHaveBeenCalledWith(expect.objectContaining({ Action: 'Clear' }));
  });

  it('preloads route on form change for aggressive cache behavior', async () => {
    await renderDesigner('aggressive');

    await page.getByLabelText('Session Therapist ID').fill('NEWTHERAPIST');

    expect(mockPreloadRoute).toHaveBeenCalled();
  });

  it('submits form and navigates to run page', async () => {
    await renderDesigner();

    await page.getByRole('button', { name: 'Run Session' }).click();

    expect(mockSettingsMutate).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/session/$group/$individual/$evaluation/run/$keyset',
      }),
    );
  });

  it('updates displayed keyset preview and timer options when selecting a new keyset', async () => {
    await renderDesigner();

    const combos = await page.getByRole('combobox').all();
    await combos[1].click();
    await page.getByRole('option', { name: 'Keyset B' }).click();

    await expect.element(page.getByText('Special Time (Timing Key)')).toBeInTheDocument();
    await expect.element(page.getByText('Scoring Time (Scoring Key)')).toBeInTheDocument();

    const timerCombos = await page.getByRole('combobox').all();
    await timerCombos[timerCombos.length - 1].click();
    await expect
      .element(page.getByRole('option', { name: /End on Special Time Time Specifically/i }))
      .toBeInTheDocument();
  });
});
