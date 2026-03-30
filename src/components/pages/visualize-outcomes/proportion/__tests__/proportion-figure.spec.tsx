import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Hoisted mocks -----

const mockGetDivPng = vi.hoisted(() => vi.fn());
const mockDivRef = vi.hoisted(() => ({ current: null }));
const mockNavigate = vi.hoisted(() => vi.fn());

// ----- Module mocks -----

vi.mock('@/components/pages/visualize-outcomes/shared/base-chart', () => ({
  BaseChart: ({ title, figureTextSize, connectSpans }: any) => (
    <div data-testid="base-chart">
      <span data-testid="chart-title">{title}</span>
      <span data-testid="chart-text-size">{figureTextSize}</span>
      <span data-testid="chart-connect">{String(connectSpans)}</span>
    </div>
  ),
}));

vi.mock('recharts-to-png', () => ({
  useGenerateImage: () => [mockGetDivPng, { ref: mockDivRef }],
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('@/lib/graphing', () => ({
  generateTicks: () => [],
  createChartLegends: () => [],
  createNavigationHandler: () => vi.fn(),
  prepareProportionDataUniversal: () => ({ preparedData: [] }),
}));

vi.mock('@/lib/calculations', () => ({
  processMultipleSessionDataWithKeys: () => [],
}));

vi.mock('@/lib/calculations/calculation-helpers', () => ({
  convertLegacyTimerType: () => 'End on Main Timer',
}));

// ----- Imports under test -----

import ProportionFigureVisualization from '../proportion-figure';

// ----- Helpers -----

const defaultProps = {
  Group: 'Group1',
  Individual: 'Client1',
  Evaluation: 'Eval1',
  FilteredSessions: [],
  ScheduleOption: 'End on Main Timer' as any,
  DynamicKeySet: {
    id: 'ks1',
    Name: 'KS1',
    FrequencyKeys: [],
    DurationKeys: [],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
    createdAt: new Date(),
  } as any,
  KeySetFull: [{ KeyDescription: 'Kicking', Visible: true }],
  FigureTextSize: 'base' as const,
  ConnectSpans: false,
  MinX: 1,
  MaxX: 10,
};

// ----- Tests -----

describe('ProportionFigureVisualization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the BaseChart component', async () => {
    await render(<ProportionFigureVisualization {...defaultProps} />);
    await expect.element(page.getByTestId('base-chart')).toBeInTheDocument();
  });

  it('passes correct title to BaseChart', async () => {
    await render(<ProportionFigureVisualization {...defaultProps} />);
    const titleEl = page.getByTestId('chart-title');
    await expect.element(titleEl).toHaveTextContent('Visualization of Data as Proportion of Session');
  });

  it('passes FigureTextSize to BaseChart', async () => {
    await render(<ProportionFigureVisualization {...defaultProps} FigureTextSize="large" />);
    await expect.element(page.getByTestId('chart-text-size')).toHaveTextContent('large');
  });

  it('passes ConnectSpans=true to BaseChart', async () => {
    await render(<ProportionFigureVisualization {...defaultProps} ConnectSpans={true} />);
    await expect.element(page.getByTestId('chart-connect')).toHaveTextContent('true');
  });

  it('passes ConnectSpans=false to BaseChart', async () => {
    await render(<ProportionFigureVisualization {...defaultProps} ConnectSpans={false} />);
    await expect.element(page.getByTestId('chart-connect')).toHaveTextContent('false');
  });

  it('renders the Download button', async () => {
    await render(<ProportionFigureVisualization {...defaultProps} />);
    await expect.element(page.getByText('Download Figure as PNG')).toBeInTheDocument();
  });
});

