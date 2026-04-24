import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';

// ----- Mocks -----

vi.mock('../views/reli-viewer-content', () => ({
  default: ({
    Paired,
    Group,
    Individual,
  }: {
    Paired: import('@/types/reli').ReliabilityPairType[];
    Group: string;
    Individual: string;
  }) => (
    <div data-testid="reli-content">
      <span data-testid="session-count">{Paired.length}</span>
      <span data-testid="group">{Group}</span>
      <span data-testid="individual">{Individual}</span>
    </div>
  ),
}));

vi.mock('@/components/ui/select', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/select')>();
  return {
    ...actual,
    Select: ({
      onValueChange,
      children,
    }: {
      onValueChange?: (value: string) => void;
      defaultValue?: string;
      children: React.ReactNode;
    }) => (
      <div>
        <button onClick={() => onValueChange?.('Unfiltered')}>Filter Unfiltered</button>
        <button onClick={() => onValueChange?.('JS')}>Filter JS</button>
        <button onClick={() => onValueChange?.('MR')}>Filter MR</button>
        {children}
      </div>
    ),
    SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => (
      <div data-value={value}>{children}</div>
    ),
  };
});

// ----- Import under test -----

import ReliabilityViewerPage from '../reli-viewer-page';

// ----- Helpers -----

const mockKeyset: import('@/types/keyset').KeySet = {
  id: 'ks-001',
  Name: 'Functional Analysis',
  createdAt: new Date('2026-01-01'),
  lastModified: new Date('2026-03-01'),
  FrequencyKeys: [],
  DurationKeys: [],
  DerivedKeys: [],
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
};

function makeSession(primaryInitials: string, reliInitials: string): import('@/types/reli').ReliabilityPairType {
  const base: import('@/lib/dtos').SavedSessionResult = {
    Filename: 'session.json',
    Keyset: mockKeyset,
    SessionSettings: {
      Therapist: 'Dr. Smith',
      Condition: 'Baseline',
      KeySet: 'Functional Analysis',
      TimerOption: 'End on Primary Timer' as import('@/types/terminations').SessionTerminationOptions,
      Initials: primaryInitials,
      Role: 'Primary',
      Session: 1,
      DurationS: 600,
    },
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    SessionStart: '2026-01-01T10:00:00',
    SessionEnd: '2026-01-01T10:10:00',
    EndedEarly: false,
    TimerMain: 600,
    TimerOne: 0,
    TimerTwo: 0,
    TimerThree: 0,
    SpecialKeyTimers: {},
    Comments: '',
  };

  return {
    primary: base,
    reli: {
      ...base,
      SessionSettings: { ...base.SessionSettings, Initials: reliInitials, Role: 'Reliability' },
    },
  };
}

// Three pairs covering distinct primary rater and reli rater combinations:
//   (JS, MR), (JS, JS), (MR, MR)
// Primary raters = ['JS', 'MR'], Reli raters = ['MR', 'JS']
const pairedSessions = [makeSession('JS', 'MR'), makeSession('JS', 'JS'), makeSession('MR', 'MR')];

const defaultProps = {
  Group: 'Study Trial A',
  Individual: 'Participant 001',
  PairedSession: pairedSessions,
  Keyset: mockKeyset,
};

const renderPage = (props = defaultProps) => render(<ReliabilityViewerPage {...props} />);

// ----- Tests -----

describe('ReliabilityViewerPage', () => {
  it('renders both filter label headings', async () => {
    await renderPage();
    await expect.element(page.getByText('Filter Primary Coder:')).toBeInTheDocument();
    await expect.element(page.getByText('Filter Reliability Coder:')).toBeInTheDocument();
  });

  it('passes all paired sessions to content on initial load when no filter is selected', async () => {
    await renderPage();
    await expect.element(page.getByTestId('session-count')).toHaveTextContent('3');
  });

  it('passes Group and Individual to ReliabilityViewerContent', async () => {
    await renderPage();
    await expect.element(page.getByTestId('group')).toHaveTextContent('Study Trial A');
    await expect.element(page.getByTestId('individual')).toHaveTextContent('Participant 001');
  });

  it('renders unique primary rater options as SelectItems', async () => {
    await renderPage();
    const jsItems = await page.getByText('JS').all();
    expect(jsItems.length).toBeGreaterThanOrEqual(1);
    const mrItems = await page.getByText('MR').all();
    expect(mrItems.length).toBeGreaterThanOrEqual(1);
  });

  it('filters to sessions matching the selected primary rater', async () => {
    await renderPage();

    // Click the primary coder filter (first occurrence of "Filter JS")
    await page.getByRole('button', { name: 'Filter JS' }).first().click();

    // Sessions 0 and 1 have primary initials 'JS'; session 2 has 'MR'
    await expect.element(page.getByTestId('session-count')).toHaveTextContent('2');
  });

  it('filters to sessions matching the selected reli rater', async () => {
    await renderPage();

    // Click the reli coder filter (second occurrence of "Filter MR")
    await page.getByRole('button', { name: 'Filter MR' }).nth(1).click();

    // Sessions 0 and 2 have reli initials 'MR'; session 1 has 'JS'
    await expect.element(page.getByTestId('session-count')).toHaveTextContent('2');
  });

  it('applies both primary and reli filters simultaneously', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Filter JS' }).first().click();
    await page.getByRole('button', { name: 'Filter MR' }).nth(1).click();

    // Only session 0 matches primary='JS' AND reli='MR'
    await expect.element(page.getByTestId('session-count')).toHaveTextContent('1');
  });

  it('restores all sessions when the primary filter is reset to Unfiltered', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Filter JS' }).first().click();
    await expect.element(page.getByTestId('session-count')).toHaveTextContent('2');

    await page.getByRole('button', { name: 'Filter Unfiltered' }).first().click();
    await expect.element(page.getByTestId('session-count')).toHaveTextContent('3');
  });

  it('restores all sessions when the reli filter is reset to Unfiltered', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Filter MR' }).nth(1).click();
    await expect.element(page.getByTestId('session-count')).toHaveTextContent('2');

    await page.getByRole('button', { name: 'Filter Unfiltered' }).nth(1).click();
    await expect.element(page.getByTestId('session-count')).toHaveTextContent('3');
  });

  it('renders with an empty paired session list without crashing', async () => {
    await renderPage({ ...defaultProps, PairedSession: [] });
    await expect.element(page.getByTestId('session-count')).toHaveTextContent('0');
  });

  it('renders with a single paired session', async () => {
    await renderPage({ ...defaultProps, PairedSession: [makeSession('AB', 'CD')] });
    await expect.element(page.getByTestId('session-count')).toHaveTextContent('1');
  });
});
