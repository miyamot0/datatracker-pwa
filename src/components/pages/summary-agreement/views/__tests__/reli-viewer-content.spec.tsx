// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';

const mockPrepareFrequencyReliTable = vi.hoisted(() =>
  vi.fn(() => ({
    rows: [[{ value: '50%' }]],
    headings: ['Key', 'IOA'],
  })),
);

const mockPrepareDurationReliTable = vi.hoisted(() =>
  vi.fn(() => ({
    rows: [[{ value: '75%' }]],
    headings: ['Key', 'Duration IOA'],
  })),
);

const mockPreventDefault = vi.hoisted(() => vi.fn());

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
  default: ({
    data,
    columnLabels,
    onKeyDown,
  }: {
    data: unknown[][];
    columnLabels: string[];
    onKeyDown?: (ev: { key: string; preventDefault: () => void }) => void;
  }) => (
    <div data-testid="spreadsheet">
      {columnLabels?.map((label, i) => (
        <span key={i}>{label}</span>
      ))}
      <span data-testid="row-count">{data.length}</span>
      <button
        onClick={() => {
          onKeyDown?.({ key: 'v', preventDefault: mockPreventDefault });
        }}
      >
        Trigger V
      </button>
      <button
        onClick={() => {
          onKeyDown?.({ key: 'x', preventDefault: mockPreventDefault });
        }}
      >
        Trigger X
      </button>
    </div>
  ),
}));

vi.mock('@/lib/reli', () => ({
  prepareFrequencyReliTable: mockPrepareFrequencyReliTable,
  prepareDurationReliTable: mockPrepareDurationReliTable,
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

  it('calls reliability table preparation helpers with paired data and keyset', async () => {
    await render(<ReliabilityViewerContent {...defaultProps} />);

    expect(mockPrepareFrequencyReliTable).toHaveBeenCalledWith(defaultProps.Paired, defaultProps.Keyset);
    expect(mockPrepareDurationReliTable).toHaveBeenCalledWith(defaultProps.Paired, defaultProps.Keyset);
  });

  it('prevents default when keydown is v (case-insensitive)', async () => {
    mockPreventDefault.mockClear();
    await render(<ReliabilityViewerContent {...defaultProps} />);

    const vTriggers = await page.getByRole('button', { name: 'Trigger V' }).all();
    await vTriggers[0].click();
    await vTriggers[1].click();

    expect(mockPreventDefault).toHaveBeenCalledTimes(2);
  });

  it('does not prevent default when keydown is not v', async () => {
    mockPreventDefault.mockClear();
    await render(<ReliabilityViewerContent {...defaultProps} />);

    const xTriggers = await page.getByRole('button', { name: 'Trigger X' }).all();
    await xTriggers[0].click();
    await xTriggers[1].click();

    expect(mockPreventDefault).not.toHaveBeenCalled();
  });
});

