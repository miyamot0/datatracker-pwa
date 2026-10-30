import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Hoisted mocks -----

const mockDivRef = vi.hoisted(() => ({ current: null }));
const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseNavigate = vi.hoisted(() => vi.fn(() => mockNavigate));
const mockGenerateTicks = vi.hoisted(() => vi.fn(() => [1, 5, 10]));
const mockCreateChartLegends = vi.hoisted(() => vi.fn(() => ['legend']));
const mockOnNavigate = vi.hoisted(() => vi.fn());
const mockCreateNavigationHandler = vi.hoisted(() => vi.fn(() => mockOnNavigate));
const mockPreparedData = vi.hoisted(() => [{ session: 1 }]);
const mockPrepareRateDataUniversal = vi.hoisted(() => vi.fn(() => ({ preparedData: mockPreparedData })));
const mockFrequencyRates = vi.hoisted(() => [{ value: 10 }]);
const mockProcessMultipleSessionDataWithKeys = vi.hoisted(() => vi.fn(() => mockFrequencyRates));
const mockConvertLegacyTimerType = vi.hoisted(() => vi.fn(() => 'converted-timer'));
const mockBaseChart = vi.hoisted(() => vi.fn());

// ----- Module mocks -----

vi.mock('@/components/pages/visualize-outcomes/shared/ui/base-chart', () => ({
  BaseChart: (props: any) => {
    mockBaseChart(props);
    return (
      <div data-testid="base-chart">
        <span data-testid="chart-title">{props.title}</span>
        <span data-testid="chart-text-size">{props.figureTextSize}</span>
        <span data-testid="chart-connect">{String(props.connectSpans)}</span>
      </div>
    );
  },
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: mockUseNavigate,
}));

vi.mock('@/lib/graphing/chart-setup', () => ({
  generateTicks: mockGenerateTicks,
  createChartLegends: mockCreateChartLegends,
  createNavigationHandler: mockCreateNavigationHandler,
}));

vi.mock('@/lib/graphing/data-preparation', () => ({
  prepareRateDataUniversal: mockPrepareRateDataUniversal,
}));

vi.mock('@/lib/calculations', () => ({
  processMultipleSessionDataWithKeys: mockProcessMultipleSessionDataWithKeys,
}));

vi.mock('@/lib/calculations/calculation-helpers', () => ({
  convertLegacyTimerType: mockConvertLegacyTimerType,
}));

// ----- Imports under test -----

import RateFigureVisualization from '../rate-figure';
import { EMPTY_SERIES_STYLES } from '@/lib/graphing/series-style';

// ----- Helpers -----

const defaultProps = {
  Group: 'Group1',
  Individual: 'Client1',
  Evaluation: 'Eval1',
  FilteredSessions: [{ SessionDate: '2024-01-01' } as any],
  ScheduleOption: 'End on Main Timer' as any,
  DynamicKeySet: {
    id: 'ks1',
    Name: 'KS1',
    FrequencyKeys: ['freqA'],
    DurationKeys: ['durA'],
    DerivedKeys: ['derivedA'],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
    createdAt: new Date(),
  } as any,
  KeySetFull: [{ KeyDescription: 'Kicking', Visible: true }],
  FigureTextSize: 'base' as const,
  ConnectSpans: false,
  MinX: 1,
  MaxX: 10,
  divRef: mockDivRef,
};

// ----- Tests -----

describe('RateFigureVisualization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateTicks.mockReturnValue([1, 5, 10]);
    mockCreateChartLegends.mockReturnValue(['legend']);
    mockCreateNavigationHandler.mockReturnValue(mockOnNavigate);
    mockConvertLegacyTimerType.mockReturnValue('converted-timer');
    mockProcessMultipleSessionDataWithKeys.mockReturnValue(mockFrequencyRates);
    mockPrepareRateDataUniversal.mockReturnValue({ preparedData: mockPreparedData });
  });

  it('renders the BaseChart component', async () => {
    await render(<RateFigureVisualization {...defaultProps} />);
    await expect.element(page.getByTestId('base-chart')).toBeInTheDocument();
  });

  it('passes correct title to BaseChart', async () => {
    await render(<RateFigureVisualization {...defaultProps} />);
    await expect.element(page.getByTestId('chart-title')).toHaveTextContent('Visualization of Data as Rates');
  });

  it('passes FigureTextSize to BaseChart', async () => {
    await render(<RateFigureVisualization {...defaultProps} FigureTextSize="large" />);
    await expect.element(page.getByTestId('chart-text-size')).toHaveTextContent('large');
  });

  it('passes ConnectSpans=true to BaseChart', async () => {
    await render(<RateFigureVisualization {...defaultProps} ConnectSpans={true} />);
    await expect.element(page.getByTestId('chart-connect')).toHaveTextContent('true');
  });

  it('passes ConnectSpans=false to BaseChart', async () => {
    await render(<RateFigureVisualization {...defaultProps} ConnectSpans={false} />);
    await expect.element(page.getByTestId('chart-connect')).toHaveTextContent('false');
  });

  it('sets the Y domain from the max override when enabled', async () => {
    await render(
      <RateFigureVisualization
        {...defaultProps}
        AxisMax={{ overrideXMax: false, xMax: null, overrideYMax: true, yMax: 25 }}
      />,
    );

    const passedProps = mockBaseChart.mock.calls[0][0];
    expect(passedProps.yAxisConfig).toEqual({
      min: 0,
      domain: [0, 25],
      label: 'Responses per Min',
      padding: { bottom: 10 },
    });
  });

  it('wires graphing and calculation utilities with expected arguments', async () => {
    await render(<RateFigureVisualization {...defaultProps} />);

    expect(mockUseNavigate).toHaveBeenCalledWith({
      from: '/session/$group/$individual/$evaluation/rate',
    });
    expect(mockGenerateTicks).toHaveBeenCalledWith(defaultProps.MaxX, defaultProps.MinX);
    expect(mockCreateChartLegends).toHaveBeenCalledWith(
      defaultProps.FilteredSessions,
      defaultProps.KeySetFull,
      EMPTY_SERIES_STYLES,
    );
    expect(mockCreateNavigationHandler).toHaveBeenCalledWith(
      mockNavigate,
      defaultProps.Group,
      defaultProps.Individual,
      defaultProps.Evaluation,
    );
    expect(mockConvertLegacyTimerType).toHaveBeenCalledWith(defaultProps.ScheduleOption, defaultProps.DynamicKeySet);
    expect(mockProcessMultipleSessionDataWithKeys).toHaveBeenCalledWith(
      defaultProps.FilteredSessions,
      defaultProps.DynamicKeySet,
      'converted-timer',
      'CHART_ALL',
      {
        frequencyKeys: [],
        durationKeys: defaultProps.DynamicKeySet.DurationKeys,
        derivedKeys: [],
      },
    );
    expect(mockPrepareRateDataUniversal).toHaveBeenCalledWith(mockFrequencyRates);

    const passedProps = mockBaseChart.mock.calls[0][0];
    expect(passedProps.preparedData).toEqual(mockPreparedData);
    expect(passedProps.xTicks).toEqual([1, 5, 10]);
    expect(passedProps.legends).toEqual(['legend']);
    expect(passedProps.onNavigate).toBe(mockOnNavigate);
    expect(passedProps.yAxisConfig).toEqual({
      min: 0,
      label: 'Responses per Min',
      padding: { bottom: 10 },
    });
    expect(passedProps.divRef).toBe(mockDivRef);
  });
});
