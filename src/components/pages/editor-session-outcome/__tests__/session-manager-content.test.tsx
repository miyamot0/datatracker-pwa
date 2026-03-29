import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import SessionManagerContent from '../session-manager-content';
import { ModifiedSessionResult } from '@/types/storage';
import { KeyManageType } from '@/types/timing';
import { KeySet } from '@/types/keyset';

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
  },
}));

const mockMutateAsync = vi.hoisted(() => vi.fn().mockResolvedValue({}));
const mockToastPromise = vi.hoisted(() =>
  vi.fn().mockImplementation(async (fn: () => Promise<unknown>) => {
    await fn();
  }),
);

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
    useRouter: () => ({ invalidate: vi.fn().mockResolvedValue(undefined) }),
    useRouterState: () => ({ matches: [{ routeId: '/outcomes/$group/$individual/$evaluation/$session' }] }),
  };
});

vi.mock('@/queries/outcomes/mutate-session-outcomes', () => ({
  mutationSettingsOutcomes: vi.fn(),
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

const makeKeyset = (): KeySet => ({
  id: 'ks-1',
  Name: 'TestSet',
  FrequencyKeys: [
    { KeyName: 'Z', KeyDescription: 'Kicking', KeyCode: 90 },
    { KeyName: 'A', KeyDescription: 'Aggression', KeyCode: 65 },
  ],
  DurationKeys: [{ KeyName: 'X', KeyDescription: 'Running', KeyCode: 88 }],
  DerivedKeys: [],
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
  createdAt: new Date(),
  lastModified: new Date(),
});

const makeKey = (
  desc: string,
  keyName: string,
  type: 'Frequency' | 'Duration' | 'System' | 'Timing',
  timeIntoSession = 60.0,
): KeyManageType => ({
  KeyName: keyName,
  KeyCode: 90,
  KeyDescription: desc,
  KeyScheduleRecording: 'Primary',
  TimePressed: new Date('2026-01-01T10:01:00'),
  TimeIntoSession: timeIntoSession,
  KeyType: type,
});

const makeSession = (): ModifiedSessionResult => ({
  Filename: 'session_001.json',
  Keyset: makeKeyset(),
  SessionSettings: {
    Condition: 'Baseline',
    TimerOption: 'End on Timer #1',
    Role: 'Primary',
    Initials: 'AB',
    Session: 3,
    DurationS: 600,
    KeySet: 'TestSet',
    Therapist: 'TS',
  },
  SystemKeyPresses: [],
  FrequencyKeyPresses: [],
  DurationKeyPresses: [],
  SessionStart: new Date('2026-01-01T10:00:00').toISOString(),
  SessionEnd: new Date('2026-01-01T10:10:00').toISOString(),
  EndedEarly: false,
  TimerMain: 600,
  TimerOne: 100,
  TimerTwo: 200,
  TimerThree: 300,
  SpecialKeyTimers: {},
  Comments: 'Initial comment.',
});

const freqKey = makeKey('Kicking', 'Z', 'Frequency', 45.0);
const durKey = makeKey('Running', 'X', 'Duration', 30.0);
const sysKey = makeKey('Session Start', 'F1', 'System', 0.0);

const renderComponent = (savedKeys: KeyManageType[] = [freqKey, durKey, sysKey]) =>
  render(
    <SessionManagerContent
      Group="Group1"
      Individual="Client1"
      Evaluation="Eval1"
      Session={makeSession()}
      SavedKeys={savedKeys}
      Handle={{} as FileSystemDirectoryHandle}
    />,
  );

// ----- Tests -----

describe('SessionManagerContent', () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockMutateAsync.mockResolvedValue({});
    mockToastPromise.mockReset();
    mockToastPromise.mockImplementation(async (fn: () => Promise<unknown>) => {
      await fn();
    });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    vi.spyOn(window, 'prompt').mockReturnValue(null);
    vi.spyOn(window, 'alert').mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---- Header / card ----

  describe('card header', () => {
    it('renders the session filename in the title', () => {
      renderComponent();
      expect(screen.getByText(/Session Record Manager/i)).not.toBeNull();
      expect(screen.getByText(/session_001\.json/i)).not.toBeNull();
    });

    it('renders the card description', () => {
      renderComponent();
      expect(screen.getByText(/Edits to current session file must be manually saved/i)).not.toBeNull();
    });

    it('renders the Update File button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /Update File/i })).not.toBeNull();
    });

    it('renders the BackButton', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
    });
  });

  // ---- Session info ----

  describe('session info', () => {
    it('displays the session number', () => {
      renderComponent();
      expect(screen.getByText('3')).not.toBeNull();
    });

    it('displays the evaluation name', () => {
      renderComponent();
      expect(screen.getByText('Eval1')).not.toBeNull();
    });

    it('displays the session condition', () => {
      renderComponent();
      expect(screen.getByText('Baseline')).not.toBeNull();
    });
  });

  // ---- Table rows ----

  describe('key table', () => {
    it('renders a row for each saved key', () => {
      renderComponent();
      expect(screen.getByText('Kicking')).not.toBeNull();
      expect(screen.getByText('Running')).not.toBeNull();
      expect(screen.getByText('Session Start')).not.toBeNull();
    });

    it('shows the time into session for each key (in seconds)', () => {
      renderComponent();
      expect(screen.getByText('45.00 seconds')).not.toBeNull();
      expect(screen.getByText('30.00 seconds')).not.toBeNull();
    });

    it('Delete Key button is disabled for System keys', () => {
      renderComponent();
      const sysRow = screen.getByText('Session Start').closest('tr')!;
      const deleteBtn = sysRow.querySelectorAll('button')[0] as HTMLButtonElement;
      expect(deleteBtn.hasAttribute('disabled')).toBe(true);
    });

    it('Delete Key button is enabled for Frequency keys', () => {
      renderComponent();
      const freqRow = screen.getByText('Kicking').closest('tr')!;
      const deleteBtn = freqRow.querySelectorAll('button')[0] as HTMLButtonElement;
      expect(deleteBtn.hasAttribute('disabled')).toBe(false);
    });

    it('Replace Key button is disabled for System keys', () => {
      renderComponent();
      const sysRow = screen.getByText('Session Start').closest('tr')!;
      const replaceBtn = sysRow.querySelectorAll('button')[1] as HTMLButtonElement;
      expect(replaceBtn.hasAttribute('disabled')).toBe(true);
    });
  });

  // ---- Delete key ----

  describe('delete key', () => {
    it('does not remove the key when confirm returns false', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderComponent();
      const freqRow = screen.getByText('Kicking').closest('tr')!;
      const deleteBtn = freqRow.querySelectorAll('button')[0] as HTMLButtonElement;
      fireEvent.click(deleteBtn);
      expect(screen.queryByText('Kicking')).not.toBeNull();
    });

    it('removes the key from the table when confirm returns true', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      renderComponent();
      const freqRow = screen.getByText('Kicking').closest('tr')!;
      const deleteBtn = freqRow.querySelectorAll('button')[0] as HTMLButtonElement;
      fireEvent.click(deleteBtn);
      expect(screen.queryByText('Kicking')).toBeNull();
    });

    it('keeps other keys when one is deleted', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      renderComponent();
      const freqRow = screen.getByText('Kicking').closest('tr')!;
      fireEvent.click(freqRow.querySelectorAll('button')[0]);
      expect(screen.queryByText('Running')).not.toBeNull();
    });
  });

  // ---- Replace key ----

  describe('replace key', () => {
    it('does not update when prompt returns null', () => {
      vi.spyOn(window, 'prompt').mockReturnValue(null);
      renderComponent();
      const freqRow = screen.getByText('Kicking').closest('tr')!;
      fireEvent.click(freqRow.querySelectorAll('button')[1]);
      expect(screen.queryByText('Kicking')).not.toBeNull();
    });

    it('shows an alert and does not update when an invalid key name is entered', () => {
      vi.spyOn(window, 'prompt').mockReturnValue('NOTAKEY');
      renderComponent();
      const freqRow = screen.getByText('Kicking').closest('tr')!;
      fireEvent.click(freqRow.querySelectorAll('button')[1]);
      expect(window.alert).toHaveBeenCalled();
      expect(screen.queryByText('Kicking')).not.toBeNull();
    });

    it('updates the key description when a valid key name is entered', () => {
      // Prompt with 'X' which maps to 'Running' in the session keyset
      vi.spyOn(window, 'prompt').mockReturnValue('X');
      renderComponent();
      const freqRow = screen.getByText('Kicking').closest('tr')!;
      fireEvent.click(freqRow.querySelectorAll('button')[1]);
      expect(screen.queryByText('Kicking')).toBeNull();
    });
  });

  // ---- Save / comments ----

  describe('save session', () => {
    it('renders the comments textarea with initial value', () => {
      renderComponent();
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Initial comment.');
    });

    it('does not call mutateAsync when confirm returns false for Update File', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Update File/i }));
      await waitFor(() => {});
      expect(mockMutateAsync).not.toHaveBeenCalled();
    });

    it('calls mutateAsync with Action: Modify when confirm returns true', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Update File/i }));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ Action: 'Modify' }));
      });
    });

    it('calls mutateAsync with Group, Individual, Evaluation in the payload', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);
      renderComponent();
      fireEvent.click(screen.getByRole('button', { name: /Update File/i }));
      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            Group: 'Group1',
            Individual: 'Client1',
            Evaluation: 'Eval1',
          }),
        );
      });
    });
  });
});
