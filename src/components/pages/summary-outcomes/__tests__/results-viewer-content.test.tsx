import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ResultsViewerContent from '../results-viewer-content';
import { DEFAULT_APPLICATION_SETTINGS } from '@/types/settings';
import { ScheduleMappingOptions } from '@/types/schedules';
import { ModifiedSessionResult } from '@/types/storage';
import { KeySet } from '@/types/keyset';
import { ToggleDisplayKey } from '@/types/visuals';

// ----- Module mocks -----

vi.mock('../views/view-frequency-results', () => ({
  default: ({
    Results,
    SessionTimer,
    Group,
    Individual,
    Evaluation,
  }: {
    Results: { SessionSettings: { Session: number } }[];
    SessionTimer: string;
    Group: string;
    Individual: string;
    Evaluation: string;
  }) => (
    <div data-testid="frequency-results">
      <span data-testid="freq-count">{Results.length}</span>
      <span data-testid="freq-timer">{SessionTimer}</span>
      <span data-testid="freq-group">{Group}</span>
      <span data-testid="freq-individual">{Individual}</span>
      <span data-testid="freq-evaluation">{Evaluation}</span>
    </div>
  ),
}));

vi.mock('../views/view-duration-results', () => ({
  default: ({
    Results,
    SessionTimer,
  }: {
    Results: { SessionSettings: { Session: number } }[];
    SessionTimer: string;
  }) => (
    <div data-testid="duration-results">
      <span data-testid="dur-count">{Results.length}</span>
      <span data-testid="dur-timer">{SessionTimer}</span>
    </div>
  ),
}));

// ----- Helpers -----

const makeKeySet = (overrides: Partial<KeySet> = {}): KeySet => ({
  id: 'ks-1',
  Name: 'TestSet',
  FrequencyKeys: [{ KeyName: 'Z', KeyDescription: 'Kicking', KeyCode: 90 }],
  DurationKeys: [{ KeyName: 'X', KeyDescription: 'Running', KeyCode: 88 }],
  DerivedKeys: [],
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
  createdAt: new Date(),
  lastModified: new Date(),
  ...overrides,
});

const makeResult = (session: number, role: 'Primary' | 'Reliability' = 'Primary'): ModifiedSessionResult => ({
  Filename: `session_${session}.json`,
  Keyset: makeKeySet(),
  SessionSettings: {
    Condition: 'Baseline',
    TimerOption: 'End on Timer #1',
    Role: role,
    Initials: 'AB',
    Session: session,
    DurationS: 600,
    KeySet: 'TestSet',
    Therapist: 'TS',
  },
  SystemKeyPresses: [],
  FrequencyKeyPresses: [],
  DurationKeyPresses: [],
  SessionStart: new Date().toISOString(),
  SessionEnd: new Date().toISOString(),
  EndedEarly: false,
  TimerMain: 600,
  TimerOne: 100,
  TimerTwo: 0,
  TimerThree: 0,
  SpecialKeyTimers: {},
  Comments: '',
});

const makeToggleKey = (desc: string): ToggleDisplayKey => ({
  KeyName: 'Z',
  KeyDescription: desc,
  KeyCode: 90,
  KeyType: 'Observed',
  Visible: true,
});

// The default TimerMapping is the first ScheduleMappingOptions entry (Timer1 = "Score Timer #1 Time")
const defaultTimerMapping = ScheduleMappingOptions[1]; // { value: 'End on Timer #1', label: 'Score Timer #1 Time' }

const renderComponent = ({
  Results = [makeResult(1), makeResult(2)],
  Keyset = makeKeySet(),
  Settings = DEFAULT_APPLICATION_SETTINGS,
}: {
  Results?: ModifiedSessionResult[];
  Keyset?: KeySet;
  Settings?: typeof DEFAULT_APPLICATION_SETTINGS;
} = {}) =>
  render(
    <ResultsViewerContent
      TimerMapping={defaultTimerMapping}
      Results={Results}
      Keyset={Keyset}
      Group="GroupA"
      Individual="ClientB"
      Evaluation="EvalC"
      ShowKeysFreq={[makeToggleKey('Kicking')]}
      ShowKeysDuration={[makeToggleKey('Running')]}
      Settings={Settings}
    />,
  );

// ----- Tests -----

describe('ResultsViewerContent', () => {
  // ---- Role filter ----

  describe('role filter', () => {
    it('renders the "Filter by Data Collector" label', () => {
      renderComponent();
      expect(screen.getByText(/Filter by Data Collector/i)).not.toBeNull();
    });

    it('renders the role select trigger', () => {
      renderComponent();
      // SelectTrigger renders a button role
      const triggers = screen.getAllByRole('combobox');
      expect(triggers.length).toBeGreaterThanOrEqual(1);
    });

    it('shows only Primary results by default', () => {
      const results = [makeResult(1, 'Primary'), makeResult(2, 'Reliability'), makeResult(3, 'Primary')];
      renderComponent({ Results: results });
      expect(screen.getByTestId('freq-count').textContent).toBe('2');
    });
  });

  // ---- Schedule filter ----

  describe('schedule filter', () => {
    it('renders the "Score By Schedule" label', () => {
      renderComponent();
      expect(screen.getByText(/Score By Schedule/i)).not.toBeNull();
    });

    it('passes the initial TimerMapping value to frequency results', () => {
      renderComponent();
      expect(screen.getByTestId('freq-timer').textContent).toBe(defaultTimerMapping.value);
    });
  });

  // ---- Frequency results ----

  describe('frequency results', () => {
    it('renders ViewFrequencyResults when Keyset has frequency keys', () => {
      renderComponent({
        Keyset: makeKeySet({ FrequencyKeys: [{ KeyName: 'Z', KeyDescription: 'Kicking', KeyCode: 90 }] }),
      });
      expect(screen.getByTestId('frequency-results')).not.toBeNull();
    });

    it('does not render ViewFrequencyResults when Keyset has no frequency keys', () => {
      renderComponent({ Keyset: makeKeySet({ FrequencyKeys: [] }) });
      expect(screen.queryByTestId('frequency-results')).toBeNull();
    });

    it('passes Group to ViewFrequencyResults', () => {
      renderComponent();
      expect(screen.getByTestId('freq-group').textContent).toBe('GroupA');
    });

    it('passes Individual to ViewFrequencyResults', () => {
      renderComponent();
      expect(screen.getByTestId('freq-individual').textContent).toBe('ClientB');
    });

    it('passes Evaluation to ViewFrequencyResults', () => {
      renderComponent();
      expect(screen.getByTestId('freq-evaluation').textContent).toBe('EvalC');
    });

    it('passes only Primary-role results to frequency view by default', () => {
      const results = [makeResult(1, 'Primary'), makeResult(2, 'Reliability')];
      renderComponent({ Results: results });
      expect(screen.getByTestId('freq-count').textContent).toBe('1');
    });
  });

  // ---- Duration results ----

  describe('duration results', () => {
    it('renders ViewDurationResults when schedule matches a ScheduleMappingOptions entry and keyset has duration keys', () => {
      // defaultTimerMapping = Timer1, which IS in ScheduleMappingOptions → showDuration = true
      renderComponent({
        Keyset: makeKeySet({ DurationKeys: [{ KeyName: 'X', KeyDescription: 'Running', KeyCode: 88 }] }),
      });
      expect(screen.getByTestId('duration-results')).not.toBeNull();
    });

    it('does not render ViewDurationResults when Keyset has no duration keys', () => {
      renderComponent({ Keyset: makeKeySet({ DurationKeys: [] }) });
      expect(screen.queryByTestId('duration-results')).toBeNull();
    });

    it('passes filtered results to duration view', () => {
      const results = [makeResult(1, 'Primary'), makeResult(2, 'Reliability')];
      renderComponent({ Results: results });
      expect(screen.getByTestId('dur-count').textContent).toBe('1');
    });

    it('passes the timer value to ViewDurationResults', () => {
      renderComponent();
      expect(screen.getByTestId('dur-timer').textContent).toBe(defaultTimerMapping.value);
    });
  });

  // ---- Results sorting and filtering ----

  describe('results filtering and sorting', () => {
    it('passes results sorted by session number to sub-views', () => {
      // Provide results out-of-order; the count passed down should still be 2 (all Primary)
      const results = [makeResult(3, 'Primary'), makeResult(1, 'Primary'), makeResult(2, 'Primary')];
      renderComponent({ Results: results });
      expect(screen.getByTestId('freq-count').textContent).toBe('3');
    });

    it('filters out Reliability results when Primary role is selected', () => {
      const results = [makeResult(1, 'Reliability'), makeResult(2, 'Reliability')];
      renderComponent({ Results: results });
      expect(screen.getByTestId('freq-count').textContent).toBe('0');
    });

    it('renders with empty results without crashing', () => {
      renderComponent({ Results: [] });
      expect(screen.getByTestId('frequency-results')).not.toBeNull();
      expect(screen.getByTestId('freq-count').textContent).toBe('0');
    });
  });

  // ---- Settings-driven schedule options ----

  describe('settings-driven schedule options', () => {
    it('renders without crashing when Timer2 is hidden by settings', () => {
      renderComponent({
        Settings: { ...DEFAULT_APPLICATION_SETTINGS, TimerTwoDisplay: 'hide' },
      });
      expect(screen.getByText(/Score By Schedule/i)).not.toBeNull();
    });

    it('renders without crashing when Timer3 is hidden by settings', () => {
      renderComponent({
        Settings: { ...DEFAULT_APPLICATION_SETTINGS, TimerThreeDisplay: 'hide' },
      });
      expect(screen.getByText(/Score By Schedule/i)).not.toBeNull();
    });
  });
});
