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

vi.mock('react-spreadsheet', () => ({
  default: ({ data, columnLabels }: { data: unknown[][]; columnLabels: string[] }) => (
    <div data-testid="spreadsheet">
      {columnLabels?.map((label, i) => (
        <span key={i}>{label}</span>
      ))}
      <span data-testid="row-count">{data.length}</span>
    </div>
  ),
}));

vi.mock('@/lib/reli', () => ({
  prepareFrequencyReliTable: vi.fn(() => ({
    rows: [[{ value: '50%' }]],
    headings: ['Key', 'IOA'],
  })),
  prepareDurationReliTable: vi.fn(() => ({
    rows: [[{ value: '75%' }]],
    headings: ['Key', 'Duration IOA'],
  })),
}));

// ----- Import under test -----

import ReliabilityViewerContent from '../reli-viewer-content';

// ----- Helpers -----

const makePaired = () => [] as any[];
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

// ----- Tests -----

describe('ReliabilityViewerContent', () => {
  const defaultProps = {
    Group: 'GroupA',
    Individual: 'ClientB',
    Paired: makePaired(),
    Keyset: makeKeyset(),
  };

  it('renders without crashing', async () => {
    const { container } = await render(<ReliabilityViewerContent {...defaultProps} />);
    expect(container).not.toBeNull();
  });

  it('renders the Frequency reliability card title', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Reliability Estimates: Frequency')).toBeInTheDocument();
  });

  it('renders the Duration reliability card title', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Reliability Estimates: Duration')).toBeInTheDocument();
  });

  it('renders the frequency card description', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Reliability Estimates: Frequency')).toBeInTheDocument();
    const descs = await page.getByText('Estimates of various indices are presented below in 10s bins').all();
    expect(descs).toHaveLength(2);
  });

  it('renders two spreadsheets', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Reliability Estimates: Frequency')).toBeInTheDocument();
    const sheets = await page.getByTestId('spreadsheet').all();
    expect(sheets).toHaveLength(2);
  });

  it('renders both reliability sections', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Reliability Estimates: Frequency')).toBeInTheDocument();
    await expect.element(page.getByText('Reliability Estimates: Duration')).toBeInTheDocument();
  });

  it('frequency spreadsheet shows column labels', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('IOA', { exact: true }).first()).toBeInTheDocument();
  });

  it('duration spreadsheet shows column labels', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);
    await expect.element(page.getByText('Duration IOA')).toBeInTheDocument();
  });
});

