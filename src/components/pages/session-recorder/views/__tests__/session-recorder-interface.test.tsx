import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    setDefaultOptions: vi.fn(),
  },
}));

vi.mock('@tanstack/react-router', () => ({
  useRouter: vi.fn(() => ({
    history: { go: vi.fn() },
    options: {},
  })),
}));

vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: false,
  })),
}));

// Worker mock — must be before worker import
vi.mock('@/workers/timing/session-recorder-worker.ts?worker', () => ({
  default: class {
    postMessage = vi.fn();
    terminate = vi.fn();
    onmessage = null;
    addEventListener = vi.fn();
    removeEventListener = vi.fn();
  },
}));

vi.mock('@/components/elements/behavior/event-listeners', () => ({
  useEventListener: vi.fn(),
}));

vi.mock('@/lib/session-keypress', () => ({
  SessionProcessKeypress: vi.fn(),
  handleMessageChannel: vi.fn(),
  handleWorkerMessage: vi.fn(),
}));

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: vi.fn(),
}));

vi.mock('@/lib/time', () => ({
  formatTimeOfDay: vi.fn(() => '12:00:00'),
}));

vi.mock('@/queries/session/mutate-session-params', () => ({
  mutationSettingsParams: vi.fn(),
}));

vi.mock('@/queries/outcomes/mutate-session-outcomes', () => ({
  mutationSettingsOutcomes: vi.fn(),
}));

vi.mock('../ui-instructions', () => ({
  default: () => <div data-testid="session-instructions">Instructions</div>,
}));

vi.mock('../ui-key-listing', () => ({
  default: () => <div data-testid="key-listing">Key Listing</div>,
}));

vi.mock('../ui-counts-frequency', () => ({
  default: () => <div data-testid="frequency-tallies">Frequency</div>,
}));

vi.mock('../ui-counts-duration', () => ({
  default: () => <div data-testid="duration-tallies">Duration</div>,
}));

vi.mock('../../subpanels/header-component', () => ({
  default: () => <div data-testid="header-component">Header</div>,
}));

// ----- Import under test -----

import SessionRecorderInterface from '../session-recorder-interface';

// ----- Helpers -----

const makeKeyset = () =>
  ({
    id: 'ks1',
    Name: 'TestSet',
    FrequencyKeys: [],
    DurationKeys: [],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
  }) as any;

const makeSettings = () =>
  ({
    Condition: 'Baseline',
    Session: 1,
    TimerOption: 'End on Timer #1',
    Initials: 'JD',
    Role: 'Primary',
    DurationS: 600,
    KeySet: 'TestSet',
    Therapist: 'Dr. Smith',
  }) as any;

const makeAppSettings = () =>
  ({
    RecorderPolling: 'normal',
    KeyDisplay: 'normal',
    DisplaySize: 'normal',
    TimerTwoDisplay: 'hide',
    TimerThreeDisplay: 'hide',
    NotificationSettings: 'All',
    EnableToolTip: true,
  }) as any;

const makeHandle = () => ({}) as FileSystemDirectoryHandle;

const defaultProps = {
  Group: 'GroupA',
  Individual: 'ClientB',
  Evaluation: 'Eval1',
  Keyset: makeKeyset(),
  Settings: makeSettings(),
  Handle: makeHandle(),
  ApplicationSettings: makeAppSettings(),
};

// ----- Tests -----

describe('SessionRecorderInterface', () => {
  it('renders without crashing', () => {
    const { container } = render(<SessionRecorderInterface {...defaultProps} />);
    expect(container).not.toBeNull();
  });

  it('renders the header component', () => {
    render(<SessionRecorderInterface {...defaultProps} />);
    expect(screen.getByTestId('header-component')).not.toBeNull();
  });

  it('renders frequency tallies', () => {
    render(<SessionRecorderInterface {...defaultProps} />);
    expect(screen.getByTestId('frequency-tallies')).not.toBeNull();
  });

  it('renders duration tallies', () => {
    render(<SessionRecorderInterface {...defaultProps} />);
    expect(screen.getByTestId('duration-tallies')).not.toBeNull();
  });

  it('renders session instructions', () => {
    render(<SessionRecorderInterface {...defaultProps} />);
    expect(screen.getByTestId('session-instructions')).not.toBeNull();
  });

  it('renders the key listing', () => {
    render(<SessionRecorderInterface {...defaultProps} />);
    expect(screen.getByTestId('key-listing')).not.toBeNull();
  });

  it('renders the Session Measurements heading', () => {
    render(<SessionRecorderInterface {...defaultProps} />);
    expect(screen.getByText('Session Measurements')).not.toBeNull();
  });

  it('renders the key history table headers', () => {
    render(<SessionRecorderInterface {...defaultProps} />);
    expect(screen.getByText('Key')).not.toBeNull();
    expect(screen.getByText('Description')).not.toBeNull();
    expect(screen.getByText('Schedule')).not.toBeNull();
    expect(screen.getByText('Time')).not.toBeNull();
  });
});
