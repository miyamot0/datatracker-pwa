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
const mockCalculateSplitPoints = vi.hoisted(() =>
  vi.fn((_data: any[], _sessions: any[], _condition: string): number[] => []),
);
const mockSplitAtPoints = vi.hoisted(() => vi.fn((data: any) => [data]));
const mockGetShape = vi.hoisted(() => vi.fn(() => 'circle'));

vi.mock('@/lib/graphing/chart-setup', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/graphing/chart-setup')>();
  return {
    getChartConfiguration: mockGetChartConfiguration,
    getChartVerticalSpacing: actual.getChartVerticalSpacing,
  };
});

vi.mock('@/lib/graphing/session-filters', () => ({
  getUniqueSessionConditions: mockGetUniqueSessionConditions,
}));

vi.mock('@/lib/graphing/data-preparation', () => ({
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

import '@/styles/globals.css';
import { BaseChart } from '../base-chart';
import { ProportionTooltip } from '../../../proportion/proportion-elements';

const legendItems = [
  { id: 'Baseline', type: 'circle' as const, value: 'Baseline', color: '#ff0000' },
  { id: 'Kicking', type: 'diamond' as const, value: 'Kicking', color: 'black' },
];

// ----- Helpers -----

const mockTooltip = () => <div data-testid="custom-tooltip" />;

const defaultProps = {
  title: 'Test Chart Title',
  textPage: 'rate' as const,
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
  divRef: { current: null } as React.RefObject<HTMLDivElement | null>,
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

  it('omits the chart title when showTitle is false', async () => {
    await render(<BaseChart {...defaultProps} showTitle={false} />);
    expect(await page.getByText('Test Chart Title').query()).toBeNull();
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

  it('renders custom legend entries from the legends prop', async () => {
    await render(
      <BaseChart
        {...defaultProps}
        legends={[{ id: 'Legend Condition', type: 'circle', value: 'Legend Condition', color: '#ff0000' }]}
      />,
    );

    await expect.poll(() => document.querySelector('.recharts-legend-item')?.textContent).toBe('Legend Condition');
  });

  it('shows the tooltip on hover without throwing (Scatter entries must have a name)', async () => {
    const data = [
      { session: 1, Condition: 'Baseline', SessionTime: 1.5, Kicking: 50 },
      { session: 2, Condition: 'Baseline', SessionTime: 2.5, Kicking: 60 },
    ];

    await render(<BaseChart {...defaultProps} preparedData={data} customTooltip={ProportionTooltip} />);

    const wrapper = document.querySelector('.recharts-wrapper') as HTMLElement;
    const rect = wrapper.getBoundingClientRect();

    // Recharts 3 processes hover in a requestAnimationFrame, so re-dispatch until the tooltip appears
    await expect
      .poll(() => {
        wrapper.dispatchEvent(
          new MouseEvent('mousemove', {
            bubbles: true,
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + rect.height / 2,
          }),
        );
        return document.body.textContent;
      })
      .toContain('Session #');
  });

  it('shows the same visible items whether hovering a dot or between dots', async () => {
    const data = [
      { session: 1, Condition: 'Baseline', SessionTime: 1.5, Kicking: 50, 'Kicking-Bouts': 2, 'Kicking-Bout-Ave': 1 },
      { session: 2, Condition: 'Baseline', SessionTime: 2.5, Kicking: 60, 'Kicking-Bouts': 3, 'Kicking-Bout-Ave': 2 },
      { session: 3, Condition: 'Baseline', SessionTime: 3.5, Kicking: 40, 'Kicking-Bouts': 1, 'Kicking-Bout-Ave': 4 },
    ];

    await render(<BaseChart {...defaultProps} preparedData={data} customTooltip={ProportionTooltip} />);

    const wrapper = document.querySelector('.recharts-wrapper') as HTMLElement;
    const rect = wrapper.getBoundingClientRect();
    const tooltipTexts: string[] = [];

    for (let step = 1; step < 20; step++) {
      wrapper.dispatchEvent(
        new MouseEvent('mousemove', {
          bubbles: true,
          clientX: rect.left + (rect.width * step) / 20,
          clientY: rect.top + rect.height / 2,
        }),
      );
      await new Promise((resolve) => setTimeout(resolve, 20));

      const text = document.body.textContent ?? '';
      if (text.includes('Session #')) tooltipTexts.push(text);
    }

    expect(tooltipTexts.length).toBeGreaterThan(0);
    for (const text of tooltipTexts) {
      expect(text).toContain('Kicking Total');
      expect(text).not.toContain('session Total');
    }
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

  it('does not draw Line vertex dots over the scatter markers', async () => {
    mockGetUniqueSessionConditions.mockReturnValue(['Baseline']);
    await render(
      <BaseChart
        {...defaultProps}
        preparedData={[
          { session: 1, Condition: 'Baseline', Kicking: 10 },
          { session: 2, Condition: 'Baseline', Kicking: 40 },
          { session: 3, Condition: 'Baseline', Kicking: 70 },
        ]}
        filteredSessions={[
          { Condition: 'Baseline' } as any,
          { Condition: 'Baseline' } as any,
          { Condition: 'Baseline' } as any,
        ]}
      />,
    );

    await vi.waitFor(() => expect(document.querySelectorAll('.recharts-symbols').length).toBeGreaterThan(0));
    expect(document.querySelectorAll('.recharts-line-dot').length).toBe(0);
    expect(document.querySelectorAll('.recharts-active-dot').length).toBe(0);
  });

  it('places the tooltip above the legend', async () => {
    await render(<BaseChart {...defaultProps} legends={legendItems} />);
    await vi.waitFor(() => expect(document.querySelector('.recharts-legend-wrapper')).not.toBeNull());

    const tooltip = document.querySelector('.recharts-tooltip-wrapper') as HTMLElement;
    const legend = document.querySelector('.recharts-legend-wrapper') as HTMLElement;
    const tooltipZ = Number(getComputedStyle(tooltip).zIndex);
    const legendZ = Number(getComputedStyle(legend).zIndex) || 0;
    expect(tooltipZ).toBeGreaterThan(legendZ);
  });

  it('outlines condition legend markers in black and keeps their labels black', async () => {
    await render(
      <BaseChart
        {...defaultProps}
        legends={[{ id: 'Baseline', kind: 'condition', type: 'circle', value: 'Baseline', color: '#ffffff' }]}
      />,
    );
    await vi.waitFor(() => expect(document.querySelectorAll('.recharts-legend-item').length).toBe(1));

    const item = document.querySelector('.recharts-legend-item')!;
    const marker = item.querySelector('svg path')!;
    expect(marker.getAttribute('stroke')).toBe('black');
    expect(marker.getAttribute('stroke-width')).toBe('3');
    expect(getComputedStyle(marker).fill).toBe('rgb(255, 255, 255)');
    expect(getComputedStyle(item.querySelector('.recharts-legend-item-text')!).color).toBe('rgb(0, 0, 0)');
  });

  it('vertically centres each legend marker on its label', async () => {
    await render(<BaseChart {...defaultProps} legends={legendItems} />);
    await vi.waitFor(() => expect(document.querySelectorAll('.recharts-legend-item').length).toBe(2));

    for (const item of Array.from(document.querySelectorAll('.recharts-legend-item'))) {
      const marker = item.querySelector('svg')!.getBoundingClientRect();
      const label = item.querySelector('.recharts-legend-item-text')!.getBoundingClientRect();
      const markerCentre = marker.top + marker.height / 2;
      const labelCentre = label.top + label.height / 2;
      expect(Math.abs(markerCentre - labelCentre)).toBeLessThan(1);
    }
  });

  it('does not draw the full-length Recharts axis lines', async () => {
    await render(<BaseChart {...defaultProps} />);
    await vi.waitFor(() => expect(document.querySelectorAll('.axis-span-line').length).toBe(2));

    expect(document.querySelectorAll('.recharts-cartesian-axis-line').length).toBe(0);
  });

  it('draws both axis lines when there is no data', async () => {
    const originalConfig = mockGetChartConfiguration.getMockImplementation();
    const actual = await vi.importActual<typeof import('@/lib/graphing/chart-setup')>('@/lib/graphing/chart-setup');
    mockGetChartConfiguration.mockImplementation(actual.getChartConfiguration);

    try {
      mockGetUniqueSessionConditions.mockReturnValue([]);
      await render(<BaseChart {...defaultProps} preparedData={[]} filteredSessions={[]} />);
      await vi.waitFor(() => expect(document.querySelectorAll('.axis-span-line').length).toBe(2));

      const xLine = document.querySelector('.axis-span-line-x')!.getBoundingClientRect();
      const yLine = document.querySelector('.axis-span-line-y')!.getBoundingClientRect();
      expect(xLine.width).toBeGreaterThan(100);
      expect(yLine.height).toBeGreaterThan(100);
    } finally {
      mockGetChartConfiguration.mockImplementation(originalConfig!);
    }
  });

  it('spans the x axis between the first and last tick when there is no data', async () => {
    const originalConfig = mockGetChartConfiguration.getMockImplementation();
    const actual = await vi.importActual<typeof import('@/lib/graphing/chart-setup')>('@/lib/graphing/chart-setup');
    mockGetChartConfiguration.mockImplementation(actual.getChartConfiguration);

    try {
      mockGetUniqueSessionConditions.mockReturnValue([]);
      await render(<BaseChart {...defaultProps} preparedData={[]} filteredSessions={[]} />);
      await vi.waitFor(() => expect(document.querySelectorAll('.axis-span-line-x').length).toBe(1));

      const tickXs = Array.from(document.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-line')).map(
        (el) => el.getBoundingClientRect().left,
      );
      const line = document.querySelector('.axis-span-line-x')!.getBoundingClientRect();
      expect(tickXs.length).toBe(5);
      expect(Math.abs(line.left - Math.min(...tickXs))).toBeLessThan(1);
      expect(Math.abs(line.right - Math.max(...tickXs))).toBeLessThan(1);
    } finally {
      mockGetChartConfiguration.mockImplementation(originalConfig!);
    }
  });

  it('spans the x axis to the last session with the real x axis settings', async () => {
    const originalConfig = mockGetChartConfiguration.getMockImplementation();
    const actual = await vi.importActual<typeof import('@/lib/graphing/chart-setup')>('@/lib/graphing/chart-setup');
    mockGetChartConfiguration.mockImplementation(actual.getChartConfiguration);

    try {
      const sessions = Array.from({ length: 12 }, (_, i) => i + 1);
      await render(
        <BaseChart
          {...defaultProps}
          preparedData={sessions.map((session) => ({ session, Condition: 'Baseline', Kicking: 50 }))}
          maxX={12}
          xTicks={actual.generateTicks(12, 1)}
        />,
      );
      await vi.waitFor(() => expect(document.querySelectorAll('.axis-span-line-x').length).toBe(1));

      const tickXs = Array.from(document.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-line')).map(
        (el) => el.getBoundingClientRect().left,
      );
      const line = document.querySelector('.axis-span-line-x')!.getBoundingClientRect();
      expect(tickXs.length).toBe(12);
      expect(Math.abs(line.left - Math.min(...tickXs))).toBeLessThan(1);
      expect(Math.abs(line.right - Math.max(...tickXs))).toBeLessThan(1);
    } finally {
      mockGetChartConfiguration.mockImplementation(originalConfig!);
    }
  });

  it('spans the x axis line from the first to the last x tick', async () => {
    await render(
      <BaseChart
        {...defaultProps}
        preparedData={[1, 2, 3, 4, 5].map((session) => ({ session, Condition: 'Baseline', Kicking: 50 }))}
      />,
    );
    await vi.waitFor(() => expect(document.querySelectorAll('.axis-span-line-x').length).toBe(1));

    const tickXs = Array.from(document.querySelectorAll('.recharts-xAxis .recharts-cartesian-axis-tick-line')).map(
      (el) => el.getBoundingClientRect().left,
    );
    const line = document.querySelector('.axis-span-line-x')!.getBoundingClientRect();
    expect(tickXs.length).toBeGreaterThan(1);
    expect(Math.abs(line.left - Math.min(...tickXs))).toBeLessThan(1);
    expect(Math.abs(line.right - Math.max(...tickXs))).toBeLessThan(1);
  });

  it('spans the y axis line from the first to the last y tick', async () => {
    await render(<BaseChart {...defaultProps} />);
    await vi.waitFor(() => expect(document.querySelectorAll('.axis-span-line-y').length).toBe(1));

    const tickYs = Array.from(document.querySelectorAll('.recharts-yAxis .recharts-cartesian-axis-tick-line')).map(
      (el) => el.getBoundingClientRect().top,
    );
    const line = document.querySelector('.axis-span-line-y')!.getBoundingClientRect();
    expect(tickYs.length).toBeGreaterThan(1);
    expect(Math.abs(line.top - Math.min(...tickYs))).toBeLessThan(1);
    expect(Math.abs(line.bottom - Math.max(...tickYs))).toBeLessThan(1);
  });
});
