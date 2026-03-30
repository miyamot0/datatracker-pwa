import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
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
  it('renders without crashing', async () => {
    const { container } = await render(<KeyHistoryListing {...defaultProps} />);
    expect(container).not.toBeNull();
  });

  it('renders the Total timer row (no AssignedTimer)', async () => {
    await render(<KeyHistoryListing {...defaultProps} />);
    await expect.element(page.getByTestId('padded-timer-row').first()).toBeInTheDocument();
    const rows = await page.getByTestId('padded-timer-row').all();
    const textContents = await Promise.all(rows.map((r) => r.element().textContent));
    expect(textContents.some((t) => t === 'Total')).toBe(true);
  });

  it('renders the Primary timer row', async () => {
    await render(<KeyHistoryListing {...defaultProps} />);
    await expect.element(page.getByTestId('padded-timer-row').first()).toBeInTheDocument();
    const rows = await page.getByTestId('padded-timer-row').all();
    const textContents = await Promise.all(rows.map((r) => r.element().textContent));
    expect(textContents.some((t) => t === 'Primary')).toBe(true);
  });

  it('does not render Secondary timer when TimerTwoDisplay is hide', async () => {
    await render(<KeyHistoryListing {...defaultProps} AppSettings={makeAppSettings({ TimerTwoDisplay: 'hide' })} />);
    await expect.element(page.getByTestId('padded-timer-row').first()).toBeInTheDocument();
    const rows = await page.getByTestId('padded-timer-row').all();
    const textContents = await Promise.all(rows.map((r) => r.element().textContent));
    expect(textContents.some((t) => t === 'Secondary')).toBe(false);
  });

  it('renders Secondary timer when TimerTwoDisplay is show', async () => {
    await render(<KeyHistoryListing {...defaultProps} AppSettings={makeAppSettings({ TimerTwoDisplay: 'show' })} />);
    await expect.element(page.getByTestId('padded-timer-row').first()).toBeInTheDocument();
    const rows = await page.getByTestId('padded-timer-row').all();
    const textContents = await Promise.all(rows.map((r) => r.element().textContent));
    expect(textContents.some((t) => t === 'Secondary')).toBe(true);
  });

  it('renders Tertiary timer when TimerThreeDisplay is show', async () => {
    await render(<KeyHistoryListing {...defaultProps} AppSettings={makeAppSettings({ TimerThreeDisplay: 'show' })} />);
    await expect.element(page.getByTestId('padded-timer-row').first()).toBeInTheDocument();
    const rows = await page.getByTestId('padded-timer-row').all();
    const textContents = await Promise.all(rows.map((r) => r.element().textContent));
    expect(textContents.some((t) => t === 'Tertiary')).toBe(true);
  });

  it('renders a row for each special key', async () => {
    const specialKeys = [
      { KeyName: 'F', KeyDescription: 'Schedule A', KeyCode: 70 },
      { KeyName: 'G', KeyDescription: 'Schedule B', KeyCode: 71 },
    ] as any[];
    await render(<KeyHistoryListing {...defaultProps} KeySetSpecialKeys={specialKeys} />);
    await expect.element(page.getByText('Schedule A')).toBeInTheDocument();
    await expect.element(page.getByText('Schedule B')).toBeInTheDocument();
  });

  it('renders special key timer values', async () => {
    const specialKeys = [{ KeyName: 'F', KeyDescription: 'Sched A', KeyCode: 70 }] as any[];
    await render(<KeyHistoryListing {...defaultProps} KeySetSpecialKeys={specialKeys} SpecialKeyTimers={{ F: 42 }} />);
    await expect.element(page.getByText('42s')).toBeInTheDocument();
  });
});

