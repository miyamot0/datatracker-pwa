import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Hoisted mocks -----

const mockGetDivPng = vi.hoisted(() => vi.fn());
const mockDivRef = vi.hoisted(() => ({ current: null }));
const mockNavigate = vi.hoisted(() => vi.fn());
const mockUseNavigate = vi.hoisted(() => vi.fn(() => mockNavigate));
const mockGenerateTicks = vi.hoisted(() => vi.fn(() => [1, 5, 10]));
const mockCreateChartLegends = vi.hoisted(() => vi.fn(() => ['legend']));
const mockOnNavigate = vi.hoisted(() => vi.fn());
const mockCreateNavigationHandler = vi.hoisted(() => vi.fn(() => mockOnNavigate));
const mockPreparedData = vi.hoisted(() => [{ session: 1 }]);
const mockPrepareProportionDataUniversal = vi.hoisted(() => vi.fn(() => ({ preparedData: mockPreparedData })));
const mockDurationCalculations = vi.hoisted(() => [{ value: 10 }]);
const mockProcessMultipleSessionDataWithKeys = vi.hoisted(() => vi.fn(() => mockDurationCalculations));
const mockConvertLegacyTimerType = vi.hoisted(() => vi.fn(() => 'converted-timer'));
const mockBaseChart = vi.hoisted(() => vi.fn());

// ----- Module mocks -----

vi.mock('@/components/pages/visualize-outcomes/shared/base-chart', () => ({
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

vi.mock('recharts-to-png', () => ({
  useGenerateImage: () => [mockGetDivPng, { ref: mockDivRef }],
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
  prepareProportionDataUniversal: mockPrepareProportionDataUniversal,
}));

vi.mock('@/lib/calculations', () => ({
  processMultipleSessionDataWithKeys: mockProcessMultipleSessionDataWithKeys,
}));

vi.mock('@/lib/calculations/calculation-helpers', () => ({
  convertLegacyTimerType: mockConvertLegacyTimerType,
}));

// ----- Imports under test -----

import ProportionFigureVisualization from '../proportion-figure';

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
};

// ----- Tests -----

describe('ProportionFigureVisualization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateTicks.mockReturnValue([1, 5, 10]);
    mockCreateChartLegends.mockReturnValue(['legend']);
    mockCreateNavigationHandler.mockReturnValue(mockOnNavigate);
    mockConvertLegacyTimerType.mockReturnValue('converted-timer');
    mockProcessMultipleSessionDataWithKeys.mockReturnValue(mockDurationCalculations);
    mockPrepareProportionDataUniversal.mockReturnValue({ preparedData: mockPreparedData });
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

  it('wires graphing and calculation utilities with expected arguments', async () => {
    await render(<ProportionFigureVisualization {...defaultProps} />);

    expect(mockUseNavigate).toHaveBeenCalledWith({
      from: '/session/$group/$individual/$evaluation/proportion',
    });
    expect(mockGenerateTicks).toHaveBeenCalledWith(defaultProps.MaxX, defaultProps.MinX);
    expect(mockCreateChartLegends).toHaveBeenCalledWith(defaultProps.FilteredSessions, defaultProps.KeySetFull);
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
        frequencyKeys: defaultProps.DynamicKeySet.FrequencyKeys,
        durationKeys: [],
        derivedKeys: defaultProps.DynamicKeySet.DerivedKeys,
      },
    );
    expect(mockPrepareProportionDataUniversal).toHaveBeenCalledWith(mockDurationCalculations);

    const passedProps = mockBaseChart.mock.calls[0][0];
    expect(passedProps.preparedData).toEqual(mockPreparedData);
    expect(passedProps.xTicks).toEqual([1, 5, 10]);
    expect(passedProps.legends).toEqual(['legend']);
    expect(passedProps.onNavigate).toBe(mockOnNavigate);
    expect(passedProps.yAxisConfig).toEqual({
      min: 0,
      max: 100,
      domain: [0, 100],
      label: 'Percentage of Session',
      padding: { bottom: 10 },
    });
    expect(passedProps.divRef).toBe(mockDivRef);
  });

  it('downloads a PNG when image generation succeeds', async () => {
    const anchorMock = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    const realCreateElement = document.createElement.bind(document);
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName.toLowerCase() === 'a') {
        return anchorMock as any;
      }

      return realCreateElement(tagName);
    }) as any);
    mockGetDivPng.mockResolvedValueOnce('data:image/png;base64,abc');

    await render(<ProportionFigureVisualization {...defaultProps} />);
    await page.getByText('Download Figure as PNG').click();

    await expect.poll(() => mockGetDivPng.mock.calls.length).toBe(1);
    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(anchorMock.href).toBe('data:image/png;base64,abc');
    expect(anchorMock.download).toBe('figure.png');
    expect(anchorMock.click).toHaveBeenCalledTimes(1);
  });

  it('does not trigger a download when image generation returns nothing', async () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    mockGetDivPng.mockResolvedValueOnce(undefined);

    await render(<ProportionFigureVisualization {...defaultProps} />);
    await page.getByText('Download Figure as PNG').click();

    await expect.poll(() => mockGetDivPng.mock.calls.length).toBe(1);
    expect(createElementSpy.mock.calls.some(([tagName]) => tagName === 'a')).toBe(false);
  });
});
