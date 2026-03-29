import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ----- Module mocks -----

vi.mock('../padded-row', () => ({
  PaddedTimerRow: ({ AssignedTimer }: { AssignedTimer: string | undefined }) => (
    <div data-testid="padded-timer-row">{AssignedTimer ?? 'Total'}</div>
  ),
}));

vi.mock('@/lib/time', () => ({
  formatTimeSeconds: (s: number) => `${s}s`,
}));

// ----- Import under test -----

import KeyHistoryListing from '../ui-key-listing';

// ----- Helpers -----

const makeAppSettings = (overrides = {}) =>
  ({
    TimerTwoDisplay: 'hide',
    TimerThreeDisplay: 'hide',
    ...overrides,
  }) as any;

const defaultProps = {
  KeySetSpecialKeys: [],
  SpecialKeyTimers: {},
  SecondsElapsed: 0,
  SecondsElapsedFirst: 0,
  SecondsElapsedSecond: 0,
  SecondsElapsedThird: 0,
  SecondsElapsedDelta: 0,
  ActiveTimer: 'Stopped' as const,
  ActiveSpecialTimer: null,
  Running: false,
  AppSettings: makeAppSettings(),
};

// ----- Tests -----

describe('KeyHistoryListing', () => {
  it('renders without crashing', () => {
    const { container } = render(<KeyHistoryListing {...defaultProps} />);
    expect(container).not.toBeNull();
  });

  it('renders the Total timer row (no AssignedTimer)', () => {
    render(<KeyHistoryListing {...defaultProps} />);
    const rows = screen.getAllByTestId('padded-timer-row');
    expect(rows.some((r) => r.textContent === 'Total')).toBe(true);
  });

  it('renders the Primary timer row', () => {
    render(<KeyHistoryListing {...defaultProps} />);
    const rows = screen.getAllByTestId('padded-timer-row');
    expect(rows.some((r) => r.textContent === 'Primary')).toBe(true);
  });

  it('does not render Secondary timer when TimerTwoDisplay is hide', () => {
    render(<KeyHistoryListing {...defaultProps} AppSettings={makeAppSettings({ TimerTwoDisplay: 'hide' })} />);
    const rows = screen.getAllByTestId('padded-timer-row');
    expect(rows.some((r) => r.textContent === 'Secondary')).toBe(false);
  });

  it('renders Secondary timer when TimerTwoDisplay is show', () => {
    render(<KeyHistoryListing {...defaultProps} AppSettings={makeAppSettings({ TimerTwoDisplay: 'show' })} />);
    const rows = screen.getAllByTestId('padded-timer-row');
    expect(rows.some((r) => r.textContent === 'Secondary')).toBe(true);
  });

  it('renders Tertiary timer when TimerThreeDisplay is show', () => {
    render(<KeyHistoryListing {...defaultProps} AppSettings={makeAppSettings({ TimerThreeDisplay: 'show' })} />);
    const rows = screen.getAllByTestId('padded-timer-row');
    expect(rows.some((r) => r.textContent === 'Tertiary')).toBe(true);
  });

  it('renders a row for each special key', () => {
    const specialKeys = [
      { KeyName: 'F', KeyDescription: 'Schedule A', KeyCode: 70 },
      { KeyName: 'G', KeyDescription: 'Schedule B', KeyCode: 71 },
    ] as any[];
    render(<KeyHistoryListing {...defaultProps} KeySetSpecialKeys={specialKeys} />);
    expect(screen.getByText('Schedule A')).not.toBeNull();
    expect(screen.getByText('Schedule B')).not.toBeNull();
  });

  it('renders special key timer values', () => {
    const specialKeys = [{ KeyName: 'F', KeyDescription: 'Sched A', KeyCode: 70 }] as any[];
    render(<KeyHistoryListing {...defaultProps} KeySetSpecialKeys={specialKeys} SpecialKeyTimers={{ F: 42 }} />);
    expect(screen.getByText('42s')).not.toBeNull();
  });
});
