import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SessionDesigner from '../session-designer-form';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import { DEFAULT_SESSION_SETTINGS } from '@/lib/dtos';
import { KeySet } from '@/types/keyset';

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue({ KeySet: 'TestSet' }));
const mockToastPromise = vi.hoisted(() =>
  vi.fn().mockImplementation(async (fn: () => Promise<unknown>) => {
    await fn();
  }),
);
const mockDisplayNotification = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useMutation: vi.fn().mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    }),
  };
});

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useRouter: () => ({
      invalidate: vi.fn().mockResolvedValue(undefined),
      preloadRoute: vi.fn().mockResolvedValue(undefined),
    }),
    useRouterState: () => ({ matches: [{ routeId: '/session/$group/$individual/$evaluation/' }] }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/queries/conditions/mutate-conditions', () => ({
  mutationConditions: vi.fn(),
}));

vi.mock('@/queries/session/mutate-session-params', () => ({
  mutationSettingsParams: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: mockDisplayNotification,
}));

vi.mock('sonner', () => ({
  toast: Object.assign(vi.fn(), {
    promise: mockToastPromise,
  }),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

vi.mock('@/components/ui/tooltip-wrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ----- Helpers -----

const makeKeySet = (name: string): KeySet => ({
  id: 'ks-1',
  Name: name,
  FrequencyKeys: [{ KeyName: 'Z', KeyDescription: 'Kicking', KeyCode: 90 }],
  DurationKeys: [{ KeyName: 'X', KeyDescription: 'Running', KeyCode: 88 }],
  DerivedKeys: [],
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
  createdAt: new Date(),
  lastModified: new Date(),
});

const defaultSessionSettings = {
  ...DEFAULT_SESSION_SETTINGS,
  KeySet: 'TestSet',
  Condition: 'Baseline',
  Initials: 'AB',
  Therapist: 'TS',
};

const renderComponent = (
  overrides: {
    Conditions?: string[];
    Keysets?: KeySet[];
    SessionSettings?: typeof defaultSessionSettings;
  } = {},
) =>
  render(
    <SessionDesigner
      Group="Group1"
      Individual="Client1"
      Evaluation="Eval1"
      Conditions={overrides.Conditions ?? ['Baseline', 'Intervention']}
      Keysets={overrides.Keysets ?? [makeKeySet('TestSet')]}
      SessionSettings={overrides.SessionSettings ?? defaultSessionSettings}
      Settings={DEFAULT_APPLICATION_SETTINGS}
      Handle={{} as FileSystemDirectoryHandle}
    />,
  );

// ----- Tests -----

describe('SessionDesigner', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({ KeySet: 'TestSet' });
    mockDisplayNotification.mockReset();
    mockToastPromise.mockReset();
    mockToastPromise.mockImplementation(async (fn: () => Promise<unknown>) => {
      await fn();
    });
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Card rendering ----

  describe('card rendering', () => {
    it('renders the Session Designer card title', () => {
      renderComponent();
      expect(screen.getByText('Session Designer')).not.toBeNull();
    });

    it('renders the card description', () => {
      renderComponent();
      expect(screen.getByText(/Specify your conditions for the session/i)).not.toBeNull();
    });

    it('renders the BackButton', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
    });

    it('renders the Run Session submit button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /Run Session/i })).not.toBeNull();
    });
  });

  // ---- Condition management ----

  describe('condition management buttons', () => {
    it('renders the Add New Condition button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /Add New Condition/i })).not.toBeNull();
    });

    it('renders the Clear Empty Condition(s) button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /Clear Empty Condition/i })).not.toBeNull();
    });

    it('does nothing when prompt returns null for Add Condition', async () => {
      vi.spyOn(window, 'prompt').mockReturnValue(null);
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Add New Condition/i }));
      await waitFor(() => {});
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('does nothing when prompt returns an empty string for Add Condition', async () => {
      vi.spyOn(window, 'prompt').mockReturnValue('   ');
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Add New Condition/i }));
      await waitFor(() => {});
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('shows a notification when adding an already-existing condition', async () => {
      vi.spyOn(window, 'prompt').mockReturnValue('Baseline');
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Add New Condition/i }));
      await waitFor(() => {
        expect(mockDisplayNotification).toHaveBeenCalledWith(
          expect.anything(),
          'Error Adding Condition',
          expect.any(String),
          expect.any(Number),
          expect.any(Boolean),
        );
      });
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutateAsync with Action: Add for a new condition', async () => {
      vi.spyOn(window, 'prompt').mockReturnValue('NewCondition');
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Add New Condition/i }));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({ Action: 'Add', Condition: 'NewCondition' }),
        );
      });
    });

    it('does not call mutateAsync when confirm returns false for Clear', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Clear Empty Condition/i }));
      await waitFor(() => {});
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutateAsync with Action: Clear when confirm returns true', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Clear Empty Condition/i }));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ Action: 'Clear' }));
      });
    });
  });

  // ---- Form field labels ----

  describe('form field labels', () => {
    it('renders the Session Condition label', () => {
      renderComponent();
      expect(screen.getByText('Session Condition')).not.toBeNull();
    });

    it('renders the Session KeySet label', () => {
      renderComponent();
      expect(screen.getByText('Session KeySet')).not.toBeNull();
    });

    it('renders the Session Therapist ID label', () => {
      renderComponent();
      expect(screen.getByText('Session Therapist ID')).not.toBeNull();
    });

    it('renders the Data Collector ID label', () => {
      renderComponent();
      expect(screen.getByText('Data Collector ID')).not.toBeNull();
    });

    it('renders the Role as Data Collector label', () => {
      renderComponent();
      expect(screen.getByText('Role as Data Collector')).not.toBeNull();
    });

    it('renders the Session Length label', () => {
      renderComponent();
      expect(screen.getByText('Session Length')).not.toBeNull();
    });

    it('renders the Session Number label', () => {
      renderComponent();
      expect(screen.getByText('Session Number')).not.toBeNull();
    });

    it('renders the Session Termination Option label', () => {
      renderComponent();
      expect(screen.getByText('Session Termination Option')).not.toBeNull();
    });
  });

  // ---- Keyset side panels ----

  describe('keyset side panels', () => {
    it('renders the Frequency Keys card', () => {
      renderComponent();
      expect(screen.getByText('Frequency Keys')).not.toBeNull();
    });

    it('renders the Duration Keys card', () => {
      renderComponent();
      expect(screen.getByText('Duration Keys')).not.toBeNull();
    });

    it('shows frequency key descriptions for the selected keyset', () => {
      renderComponent();
      expect(screen.getByText('Kicking')).not.toBeNull();
    });

    it('shows duration key descriptions for the selected keyset', () => {
      renderComponent();
      expect(screen.getByText('Running')).not.toBeNull();
    });

    it('frequency key table is empty when no keyset matches SessionSettings.KeySet', () => {
      renderComponent({
        Keysets: [],
        SessionSettings: { ...defaultSessionSettings, KeySet: 'NoMatch' },
      });
      expect(screen.queryByText('Kicking')).toBeNull();
    });

    it('shows Timing Key label for SpecialDurationKeys', () => {
      const keysetWithSpecial = {
        ...makeKeySet('TestSet'),
        SpecialDurationKeys: [{ KeyName: 'T', KeyDescription: 'OnTask', KeyCode: 84 }],
      };
      renderComponent({ Keysets: [keysetWithSpecial] });
      expect(screen.getByText('OnTask (Timing Key)')).not.toBeNull();
    });

    it('shows Scoring Key label for ScorableDurationKeys', () => {
      const keysetWithScorable = {
        ...makeKeySet('TestSet'),
        ScorableDurationKeys: [{ KeyName: 'S', KeyDescription: 'Score', KeyCode: 83 }],
      };
      renderComponent({ Keysets: [keysetWithScorable] });
      expect(screen.getByText('Score (Scoring Key)')).not.toBeNull();
    });
  });
});
