// @ts-nocheck

import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';

// ----- Module mocks -----

vi.mock('../session-figure', () => ({
  default: () => <div data-testid="session-figure" />,
}));

vi.mock('../session-key-list', () => ({
  default: () => <div data-testid="session-key-list" />,
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <button>Back</button>,
}));

const mockSetLocalCachedPrefs = vi.hoisted(() => vi.fn());
vi.mock('@/lib/local_storage', () => ({
  setLocalCachedPrefs: mockSetLocalCachedPrefs,
}));

// ----- Import under test -----

import SessionViewerContent from '../session-viewer-content';

// ----- Helpers -----

const makeExpandedSession = (overrides: Record<string, unknown> = {}) =>
  ({
    SessionSettings: {
      Condition: 'Baseline',
      Session: 3,
      TimerOption: 'End on Timer #1',
      Initials: 'JD',
      Role: 'Primary',
      DurationS: 600,
      KeySet: 'TestSet',
      Therapist: 'Dr. Smith',
    },
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    PlottedKeys: [],
    SessionStart: new Date('2024-01-15').toISOString(),
    SessionEnd: new Date('2024-01-15').toISOString(),
    EndedEarly: false,
    TimerMain: 60.0,
    TimerOne: 30.0,
    TimerTwo: 0.0,
    TimerThree: 0.0,
    Filename: 'test.json',
    MaxY: 5,
    YTicks: [0, 1, 2, 3, 4, 5],
    Keyset: {
      id: 'ks1',
      Name: 'TestSet',
      FrequencyKeys: [],
      DurationKeys: [],
      DerivedKeys: [],
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
      createdAt: new Date(),
    },
    Comments: 'Some comments',
    ...overrides,
  }) as any;

const defaultShowKeys = [{ KeyDescription: 'Hitting', KeyName: 'a', Visible: true }];
const defaultSettings = { NotificationSettings: 'All', EnableToolTip: true } as any;

const defaultProps = {
  Group: 'GroupA',
  Individual: 'ClientB',
  Evaluation: 'Eval1',
  ShowKeys: defaultShowKeys,
  ExpandedSession: makeExpandedSession(),
  PlotObject: [],
  Settings: defaultSettings,
};

// ----- Tests -----

describe('SessionViewerContent', () => {
  it('renders the Session Inspector card title', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByText('Session Inspector')).not.toBeNull();
  });

  it('renders the card description', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByText('Information Regarding Keys Illustrated Below')).not.toBeNull();
  });

  it('renders the Session # label', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByText('Session #:')).not.toBeNull();
  });

  it('renders the session number value', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByText('3')).not.toBeNull();
  });

  it('renders the session condition', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByText('Baseline')).not.toBeNull();
  });

  it('renders the data collector initials', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByText('JD')).not.toBeNull();
  });

  it('renders the therapist name', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByText('Dr. Smith')).not.toBeNull();
  });

  it('renders the keyset name', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByText('TestSet')).not.toBeNull();
  });

  it('renders session ended early as No when false', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByText('No')).not.toBeNull();
  });

  it('renders session ended early as Yes when true', () => {
    render(<SessionViewerContent {...defaultProps} ExpandedSession={makeExpandedSession({ EndedEarly: true })} />);
    expect(screen.getByText('Yes')).not.toBeNull();
  });

  it('renders the SessionFigure stub', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByTestId('session-figure')).not.toBeNull();
  });

  it('renders the SessionKeyList stub', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByTestId('session-key-list')).not.toBeNull();
  });

  it('renders the BackButton', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Back' })).not.toBeNull();
  });

  it('renders the Edit Keys Displayed button', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByText('Edit Keys Displayed')).not.toBeNull();
  });

  it('renders the Data Collector Role label', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByText('Data Collector Role:')).not.toBeNull();
  });

  it('renders timer duration labels', () => {
    render(<SessionViewerContent {...defaultProps} />);
    expect(screen.getByText('Timer Duration (Main):')).not.toBeNull();
    expect(screen.getByText('Timer Duration (#1):')).not.toBeNull();
  });

  describe('interactions', () => {
    it('clicking Edit Keys Displayed opens the dropdown with key checkboxes', async () => {
      const user = userEvent.setup();
      render(<SessionViewerContent {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /edit keys displayed/i }));
      expect(screen.getByRole('menuitemcheckbox', { name: 'Hitting' })).not.toBeNull();
    });

    it('toggling a visible key calls setLocalCachedPrefs', async () => {
      const user = userEvent.setup();
      mockSetLocalCachedPrefs.mockReset();
      render(<SessionViewerContent {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /edit keys displayed/i }));
      await user.click(screen.getByRole('menuitemcheckbox', { name: 'Hitting' }));
      expect(mockSetLocalCachedPrefs).toHaveBeenCalled();
    });

    it('the dropdown checkbox is initially checked for a visible key', async () => {
      const user = userEvent.setup();
      render(<SessionViewerContent {...defaultProps} />);
      await user.click(screen.getByRole('button', { name: /edit keys displayed/i }));
      const checkbox = screen.getByRole('menuitemcheckbox', { name: 'Hitting' });
      expect(checkbox.getAttribute('aria-checked')).toBe('true');
    });
  });
});
