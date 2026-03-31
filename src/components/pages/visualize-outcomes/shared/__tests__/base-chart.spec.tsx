import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Graphing / helpers mocks -----

const mockGetChartConfiguration = vi.hoisted(() =>
  vi.fn(() => ({
    noAnimationProps: {},
    chartMargins: { top: 30, right: 20, bottom: 30, left: 20 },
    xAxisConfig: {},
    yAxisStyle: {},
    labelStyle: {},
  })),
);
const mockGetUniqueSessionConditions = vi.hoisted(() => vi.fn(() => ['Baseline']));
const mockCalculateSplitPoints = vi.hoisted(() => vi.fn(() => []));
const mockSplitAtPoints = vi.hoisted(() => vi.fn((data: any) => [data]));
const mockGetShape = vi.hoisted(() => vi.fn(() => 'circle'));

vi.mock('@/lib/graphing', () => ({
  getChartConfiguration: mockGetChartConfiguration,
  getUniqueSessionConditions: mockGetUniqueSessionConditions,
  calculateSplitPoints: mockCalculateSplitPoints,
}));

vi.mock('@/lib/arrays', () => ({
  splitAtPoints: mockSplitAtPoints,
}));

vi.mock('@/lib/colors', () => ({
  FIGURE_PATH_COLORS: ['#ff0000', '#00ff00', '#0000ff'],
}));

vi.mock('@/lib/shapes', () => ({
  getShape: mockGetShape,
}));

// ----- Imports under test -----

import { BaseChart } from '../base-chart';

// ----- Helpers -----

const mockTooltip = () => <div data-testid="custom-tooltip" />;

const defaultProps = {
  title: 'Test Chart Title',
  preparedData: [{ session: 1, Condition: 'Baseline', Kicking: 50 }],
  filteredSessions: [{ Condition: 'Baseline' } as any],
  keySetFull: [{ KeyDescription: 'Kicking', Visible: true }],
  figureTextSize: 'base' as const,
  connectSpans: false,
  minX: 1,
  maxX: 5,
  xTicks: [1, 2, 3, 4, 5],
  legends: [],
  yAxisConfig: { min: 0, max: 100, domain: [0, 100] as [number, number], label: 'Percentage' },
  customTooltip: mockTooltip,
  onNavigate: vi.fn(),
  divRef: { current: null } as React.RefObject<HTMLDivElement>,
};

// ----- Tests -----

describe('BaseChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUniqueSessionConditions.mockReturnValue(['Baseline']);
    mockCalculateSplitPoints.mockReturnValue([]);
    mockSplitAtPoints.mockImplementation((data: any) => [data]);
    mockGetShape.mockReturnValue('circle');
  });

  it('renders the recharts container', async () => {
    await render(<BaseChart {...defaultProps} />);
    await expect.element(page.getByText('Test Chart Title')).toBeInTheDocument();
  });

  it('renders the chart title', async () => {
    await render(<BaseChart {...defaultProps} />);
    await expect.element(page.getByText('Test Chart Title')).toBeInTheDocument();
  });

  it('applies text-xl class on the chart container for large figureTextSize', async () => {
    await render(<BaseChart {...defaultProps} figureTextSize="large" />);
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).not.toBeNull();
    expect(container?.classList.contains('text-xl')).toBe(true);
  });

  it('applies text-2xl class on the chart container for extraLarge figureTextSize', async () => {
    await render(<BaseChart {...defaultProps} figureTextSize="extraLarge" />);
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).not.toBeNull();
    expect(container?.classList.contains('text-2xl')).toBe(true);
  });

  it('does not apply text-xl or text-2xl on the chart container for base figureTextSize', async () => {
    await render(<BaseChart {...defaultProps} figureTextSize="base" />);
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).not.toBeNull();
    expect(container?.classList.contains('text-xl')).toBe(false);
    expect(container?.classList.contains('text-2xl')).toBe(false);
  });

  it('renders with multiple visible keys without throwing', async () => {
    await render(
      <BaseChart
        {...defaultProps}
        keySetFull={[
          { KeyDescription: 'Kicking', Visible: true },
          { KeyDescription: 'Hitting', Visible: true },
        ]}
      />,
    );
    await expect.element(page.getByText('Test Chart Title')).toBeInTheDocument();
  });

  it('does not render content for invisible keys (no crash)', async () => {
    await render(<BaseChart {...defaultProps} keySetFull={[{ KeyDescription: 'Hidden', Visible: false }]} />);
    await expect.element(page.getByText('Test Chart Title')).toBeInTheDocument();
  });

  it('renders with connectSpans=true without throwing', async () => {
    await render(<BaseChart {...defaultProps} connectSpans={true} />);
    await expect.element(page.getByText('Test Chart Title')).toBeInTheDocument();
  });

  it('renders the recharts composed chart', async () => {
    await render(<BaseChart {...defaultProps} />);
    const container = document.querySelector('.recharts-responsive-container');
    expect(container).not.toBeNull();
  });

  it('uses splitAtPoints when split points exist and connectSpans is false', async () => {
    const baselineData = [
      { session: 1, Condition: 'Baseline', Kicking: 10 },
      { session: 2, Condition: 'Baseline', Kicking: 20 },
      { session: 3, Condition: 'Baseline', Kicking: 30 },
    ];
    mockCalculateSplitPoints.mockReturnValue([1]);
    mockSplitAtPoints.mockReturnValue([[baselineData[0]], [baselineData[1], baselineData[2]]]);

    await render(<BaseChart {...defaultProps} preparedData={baselineData} connectSpans={false} />);

    expect(mockCalculateSplitPoints).toHaveBeenCalledWith(baselineData, defaultProps.filteredSessions, 'Baseline');
    expect(mockSplitAtPoints).toHaveBeenCalledWith(baselineData, [1]);
  });

  it('does not split when connectSpans is true even if split points exist', async () => {
    const baselineData = [
      { session: 1, Condition: 'Baseline', Kicking: 10 },
      { session: 2, Condition: 'Baseline', Kicking: 20 },
    ];
    mockCalculateSplitPoints.mockReturnValue([1]);

    await render(<BaseChart {...defaultProps} preparedData={baselineData} connectSpans={true} />);

    expect(mockCalculateSplitPoints).toHaveBeenCalled();
    expect(mockSplitAtPoints).not.toHaveBeenCalled();
  });

  it('passes visible key index to getShape and skips hidden keys', async () => {
    await render(
      <BaseChart
        {...defaultProps}
        keySetFull={[
          { KeyDescription: 'Kicking', Visible: true },
          { KeyDescription: 'Hidden', Visible: false },
          { KeyDescription: 'Hitting', Visible: true },
        ]}
      />,
    );

    expect(mockGetShape).toHaveBeenCalledTimes(2);
    expect(mockGetShape).toHaveBeenNthCalledWith(1, 0);
    expect(mockGetShape).toHaveBeenNthCalledWith(2, 1);
  });

  it('filters preparedData by each condition before line/scatter construction', async () => {
    const baselineData = { session: 1, Condition: 'Baseline', Kicking: 10 };
    const interventionData = { session: 2, Condition: 'Intervention', Kicking: 20 };
    mockGetUniqueSessionConditions.mockReturnValue(['Baseline', 'Intervention']);

    await render(
      <BaseChart
        {...defaultProps}
        preparedData={[baselineData, interventionData]}
        filteredSessions={[{ Condition: 'Baseline' } as any, { Condition: 'Intervention' } as any]}
      />,
    );

    expect(mockCalculateSplitPoints).toHaveBeenCalledTimes(2);
    expect(mockCalculateSplitPoints.mock.calls[0][0]).toEqual([baselineData]);
    expect(mockCalculateSplitPoints.mock.calls[1][0]).toEqual([interventionData]);
    expect(mockCalculateSplitPoints.mock.calls[0][2]).toBe('Baseline');
    expect(mockCalculateSplitPoints.mock.calls[1][2]).toBe('Intervention');
  });
});
