// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
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
  useRouter: () => ({ history: { go: vi.fn() } }),
  Link: ({ children }) => <a>{children}</a>,
}));

vi.mock('@tanstack/react-hotkeys', () => ({
  useHotkey: vi.fn(),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => null,
}));

vi.mock('../session-figure', () => ({
  default: () => <div data-testid="session-figure" />,
}));

vi.mock('../session-key-list', () => ({
  default: () => <div data-testid="session-key-list" />,
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
  it('renders the Session Inspector card title', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Session Inspector')).toBeInTheDocument();
  });

  it('renders the card description', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Information Regarding Keys Illustrated Below')).toBeInTheDocument();
  });

  it('renders the Session # label', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Session #:')).toBeInTheDocument();
  });

  it('renders the session number value', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('3').first()).toBeInTheDocument();
  });

  it('renders the session condition', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Baseline')).toBeInTheDocument();
  });

  it('renders the data collector initials', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('JD')).toBeInTheDocument();
  });

  it('renders the therapist name', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Dr. Smith')).toBeInTheDocument();
  });

  it('renders the keyset name', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('TestSet')).toBeInTheDocument();
  });

  it('renders session ended early as No when false', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('No')).toBeInTheDocument();
  });

  it('renders session ended early as Yes when true', async () => {
    await render(
      <SessionViewerContent {...defaultProps} ExpandedSession={makeExpandedSession({ EndedEarly: true })} />,
    );
    await expect.element(page.getByText('Yes')).toBeInTheDocument();
  });

  it('renders the SessionFigure stub', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByTestId('session-figure')).toBeInTheDocument();
  });

  it('renders the SessionKeyList stub', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByTestId('session-key-list')).toBeInTheDocument();
  });

  it('renders layout content where BackButton appears', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Session Inspector')).toBeInTheDocument();
  });

  it('renders the Edit Keys Displayed button', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Edit Keys Displayed')).toBeInTheDocument();
  });

  it('renders the Data Collector Role label', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Data Collector Role:')).toBeInTheDocument();
  });

  it('renders timer duration labels', async () => {
    await render(<SessionViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Timer Duration (Main):')).toBeInTheDocument();
    await expect.element(page.getByText('Timer Duration (#1):')).toBeInTheDocument();
  });

  describe('interactions', () => {
    it('clicking Edit Keys Displayed opens the dropdown with key checkboxes', async () => {
      await render(<SessionViewerContent {...defaultProps} />);
      await page.getByRole('button', { name: /edit keys displayed/i }).click();
      await expect.element(page.getByRole('menuitemcheckbox', { name: 'Hitting' })).toBeInTheDocument();
    });

    it('toggling a visible key calls setLocalCachedPrefs', async () => {
      mockSetLocalCachedPrefs.mockReset();
      await render(<SessionViewerContent {...defaultProps} />);
      await page.getByRole('button', { name: /edit keys displayed/i }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Hitting' }).click();
      expect(mockSetLocalCachedPrefs).toHaveBeenCalled();
    });

    it('the dropdown checkbox is initially checked for a visible key', async () => {
      await render(<SessionViewerContent {...defaultProps} />);
      await page.getByRole('button', { name: /edit keys displayed/i }).click();
      const checkbox = page.getByRole('menuitemcheckbox', { name: 'Hitting' });
      await expect.element(checkbox).toHaveAttribute('aria-checked', 'true');
    });

    it('updates only the matching key and persists hidden key descriptions', async () => {
      mockSetLocalCachedPrefs.mockReset();

      await render(
        <SessionViewerContent
          {...defaultProps}
          ShowKeys={[
            { KeyDescription: 'Hitting', KeyName: 'a', Visible: true },
            { KeyDescription: 'Kicking', KeyName: 'b', Visible: true },
          ]}
        />,
      );

      await page.getByRole('button', { name: /edit keys displayed/i }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Hitting' }).click();

      expect(mockSetLocalCachedPrefs).toHaveBeenCalledWith('GroupA', 'ClientB', 'Eval1', 'GroupA ClientB Eval1', {
        KeyDescription: ['Hitting'],
        Schedule: 'End on Timer #1',
      });
    });
  });
});
