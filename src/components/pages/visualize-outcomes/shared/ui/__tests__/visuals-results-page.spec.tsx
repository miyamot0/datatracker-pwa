import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFigure = vi.hoisted(() => vi.fn());
const mockMenubar = vi.hoisted(() => vi.fn());
const mockFilteredSessionScoringOptions = vi.hoisted(() => vi.fn());
const mockGetLocalShowDescription = vi.hoisted(() => vi.fn(() => true));

vi.mock('@/lib/local_storage', () => ({
  setLocalCachedPrefs: vi.fn(),
  getLocalFigureFontFamily: vi.fn(() => 'default'),
  setLocalFigureFontFamily: vi.fn(),
  getLocalFigureAxisMax: vi.fn(() => ({ overrideXMax: false, xMax: null, overrideYMax: false, yMax: null })),
  setLocalFigureAxisMax: vi.fn(),
  getLocalConnectSpans: vi.fn(() => false),
  setLocalConnectSpans: vi.fn(),
  getLocalFigureLabels: vi.fn(() => ({
    overrideTitle: false,
    titleText: '',
    overrideXAxis: false,
    xAxisText: '',
    overrideYAxis: false,
    yAxisText: '',
  })),
  setLocalFigureLabels: vi.fn(),
  getLocalLegendSettings: vi.fn(() => ({ position: 'below', layout: 'horizontal' })),
  setLocalLegendSettings: vi.fn(),
  getLocalSeriesStyles: vi.fn(() => ({ KeyStyles: {}, ConditionStyles: {} })),
  setLocalSeriesStyles: vi.fn(),
  getLocalShowTitle: vi.fn(() => true),
  setLocalShowTitle: vi.fn(),
  getLocalShowTooltip: vi.fn(() => true),
  setLocalShowTooltip: vi.fn(),
  getLocalShowConditionLegend: vi.fn(() => true),
  setLocalShowConditionLegend: vi.fn(),
  getLocalShowDescription: mockGetLocalShowDescription,
  setLocalShowDescription: vi.fn(),
}));

vi.mock('@/types/schedules', () => ({
  ScheduleMappingOptions: [
    { value: 'End on Primary Timer', label: 'Score Total Time' },
    { value: 'End on Timer #1', label: 'Score Timer #1 Time' },
  ],
  filteredSessionScoringOptions: mockFilteredSessionScoringOptions,
}));

vi.mock('@/components/ui/select', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/select')>();
  return {
    ...actual,
    Select: ({ value, onValueChange, children }: any) => (
      <div>
        <div data-testid="schedule-value">{String(value)}</div>
        <button onClick={() => onValueChange('End on Timer #1')}>Set Fixed Schedule</button>
        <button onClick={() => onValueChange('Score by Special')}>Set Special Schedule</button>
        <button onClick={() => onValueChange('Unknown Value')}>Set Unknown Schedule</button>
        {children}
      </div>
    ),
    SelectTrigger: ({ children }: any) => <div>{children}</div>,
    SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
    SelectContent: ({ children }: any) => <div>{children}</div>,
    SelectGroup: ({ children }: any) => <div>{children}</div>,
    SelectItem: ({ children, value }: any) => <div data-value={value}>{children}</div>,
  };
});

const mockToast = vi.hoisted(() => ({
  success: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
}));

vi.mock('sonner', () => ({ toast: mockToast }));

vi.mock('@/lib/styles-file', () => ({
  writeStylesFile: vi.fn(),
  readStylesFile: vi.fn(),
  deleteStylesFile: vi.fn(),
  applyStylesFile: vi.fn(),
  saveStylesBackup: vi.fn(),
  restoreStylesBackup: vi.fn(),
}));

vi.mock('@/components/pages/visualize-outcomes/shared/helpers/chart-export', () => ({
  saveChartImage: vi.fn(),
}));

vi.mock('../visuals-menubar', () => ({
  VisualsMenubar: (props: any) => {
    mockMenubar(props);
    return <div data-testid="menubar" />;
  },
}));

import { VisualsResultsPage } from '../visuals-results-page';
import {
  writeStylesFile,
  readStylesFile,
  deleteStylesFile,
  applyStylesFile,
  saveStylesBackup,
  restoreStylesBackup,
} from '@/lib/styles-file';
import { saveChartImage } from '@/components/pages/visualize-outcomes/shared/helpers/chart-export';

const MockFigure = (props: any) => {
  mockFigure(props);
  return (
    <div data-testid="figure" ref={props.divRef}>
      figure
    </div>
  );
};

const config = {
  page: 'rate',
  plot: 'Rate',
  prefsType: 'Rate',
  title: 'Rate Title',
  includeScoringInSchedule: true,
  Figure: MockFigure,
} as const;

const makeProps = (override?: Record<string, unknown>) =>
  ({
    config,
    actions: <button>Export Data</button>,
    description: 'Description text',
    Group: 'GroupA',
    Individual: 'ClientB',
    Evaluation: 'Eval1',
    Conditions: ['Baseline', 'Treatment'],
    ShowKeys: [
      { KeyDescription: 'Derived Metric', KeyName: 'd', KeyType: 'Derived', Visible: true },
      { KeyDescription: 'Aggression', KeyName: 'a', KeyType: 'Observed', Visible: true },
    ],
    DynamicKeySet: {
      Name: 'KeysetA',
      FrequencyKeys: [],
      DurationKeys: [],
      DerivedKeys: [],
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
    },
    ResultsFiltered: [{ SessionSettings: { Condition: 'Treatment' } }, { SessionSettings: { Condition: 'Baseline' } }],
    TimerMapping: { value: 'End on Primary Timer', label: 'Score Total Time' },
    MinX: 1,
    MaxX: 10,
    Settings: { TimerTwoDisplay: 'show', TimerThreeDisplay: 'hide' },
    ...override,
  }) as any;

const renderPage = (override?: Record<string, unknown>) => render(<VisualsResultsPage {...makeProps(override)} />);

const lastFigureProps = () => mockFigure.mock.lastCall?.[0];
const lastMenubarProps = () => mockMenubar.mock.lastCall?.[0];

describe('VisualsResultsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLocalShowDescription.mockReturnValue(true);
    mockFilteredSessionScoringOptions.mockReturnValue([
      { value: 'End on Primary Timer', label: 'Score Total Time' },
      { value: 'End on Timer #1', label: 'Score Timer #1 Time' },
      { value: 'Score by Special', label: 'Special Key' },
    ]);
  });

  describe('header', () => {
    it('renders the config title, the actions slot, and the description', async () => {
      renderPage();

      await expect.element(page.getByText('Rate Title')).toBeVisible();
      await expect.element(page.getByRole('button', { name: 'Export Data' })).toBeVisible();
      await expect.element(page.getByText('Description text')).toBeVisible();
    });

    it('omits the description when showDescription is false', async () => {
      mockGetLocalShowDescription.mockReturnValue(false);
      renderPage();

      await expect.element(page.getByText('Rate Title')).toBeVisible();
      await expect.element(page.getByText('Description text')).not.toBeInTheDocument();
    });
  });

  describe('schedule select', () => {
    it('shows the default timer from TimerMapping', async () => {
      renderPage();

      await expect.element(page.getByTestId('schedule-value')).toHaveTextContent('End on Primary Timer');
      expect(lastFigureProps().ScheduleOption).toBe('End on Primary Timer');
    });

    it('passes a fixed schedule change through to the figure', async () => {
      renderPage();

      await page.getByRole('button', { name: 'Set Fixed Schedule' }).click();

      await expect.element(page.getByTestId('schedule-value')).toHaveTextContent('End on Timer #1');
      expect(lastFigureProps().ScheduleOption).toBe('End on Timer #1');
    });

    it('passes a special-key schedule change through to the figure', async () => {
      renderPage();

      await page.getByRole('button', { name: 'Set Special Schedule' }).click();

      await expect.element(page.getByTestId('schedule-value')).toHaveTextContent('Score by Special');
      expect(lastFigureProps().ScheduleOption).toBe('Score by Special');
    });

    it('ignores a value that matches neither option list', async () => {
      renderPage();

      await page.getByRole('button', { name: 'Set Unknown Schedule' }).click();

      expect(lastFigureProps().ScheduleOption).toBe('End on Primary Timer');
    });

    it('requests scoring options only when includeScoringInSchedule is set', async () => {
      renderPage();
      await expect.element(page.getByTestId('schedule-value')).toBeInTheDocument();
      expect(mockFilteredSessionScoringOptions).toHaveBeenCalledWith(expect.anything(), expect.anything(), true, true);
    });

    it('omits scoring options from the timer list when includeScoringInSchedule is not set', async () => {
      renderPage({ config: { ...config, includeScoringInSchedule: false } });
      await expect.element(page.getByTestId('schedule-value')).toBeInTheDocument();
      expect(mockFilteredSessionScoringOptions).toHaveBeenCalledWith(expect.anything(), expect.anything(), true, false);
    });
  });

  describe('menubar wiring', () => {
    it('orders style conditions by legend appearance, then any remaining configured conditions', async () => {
      renderPage({
        Conditions: ['Baseline', 'Treatment', 'Unused'],
        ResultsFiltered: [{ SessionSettings: { Condition: 'Treatment' } }],
      });

      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();
      expect(lastMenubarProps().styleConditions).toEqual(['Treatment', 'Baseline', 'Unused']);
    });

    it('passes the page key and only visible conditions', async () => {
      renderPage();

      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();
      const props = lastMenubarProps();
      expect(props.page).toBe('rate');
      expect(props.visibleStyleConditions).toEqual(props.styleConditions);
      expect(typeof props.onSaveImage).toBe('function');
    });
  });

  describe('styles file actions', () => {
    const STYLES = 'styles.json';

    beforeEach(() => {
      vi.mocked(writeStylesFile).mockResolvedValue(undefined as any);
      vi.mocked(readStylesFile).mockResolvedValue(null as any);
      vi.mocked(deleteStylesFile).mockResolvedValue(true);
      vi.mocked(restoreStylesBackup).mockReturnValue(true);
    });

    it('writes the styles file and reports success', async () => {
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      await act(() => lastMenubarProps().onWriteStyles());

      expect(writeStylesFile).toHaveBeenCalledWith(undefined, 'GroupA', 'ClientB', 'Eval1');
      expect(mockToast.success).toHaveBeenCalledWith(`Saved styles to ${STYLES}`);
    });

    it('reports an error when writing the styles file fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(writeStylesFile).mockRejectedValue(new Error('disk full'));
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      await act(() => lastMenubarProps().onWriteStyles());

      expect(mockToast.error).toHaveBeenCalledWith(`Could not write ${STYLES}`);
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it('shows an info toast when no styles file exists', async () => {
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      await act(() => lastMenubarProps().onReadStyles());

      expect(mockToast.info).toHaveBeenCalledWith(`No ${STYLES} found in this evaluation folder`);
      expect(applyStylesFile).not.toHaveBeenCalled();
      expect(saveStylesBackup).not.toHaveBeenCalled();
    });

    it('backs up, applies, and reloads settings when a styles file is read', async () => {
      const file = { version: 1 } as any;
      vi.mocked(readStylesFile).mockResolvedValue(file);
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      await act(() => lastMenubarProps().onReadStyles());

      expect(saveStylesBackup).toHaveBeenCalledWith('GroupA', 'ClientB', 'Eval1');
      expect(applyStylesFile).toHaveBeenCalledWith('GroupA', 'ClientB', 'Eval1', file);
      expect(mockToast.success).toHaveBeenCalledWith(`Loaded styles from ${STYLES}`, expect.any(Object));
    });

    it('restores the backup and reports it when Undo is clicked', async () => {
      vi.mocked(readStylesFile).mockResolvedValue({ version: 1 } as any);
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      await act(() => lastMenubarProps().onReadStyles());
      const options = mockToast.success.mock.calls[0][1] as any;
      await act(() => options.action.onClick());

      expect(restoreStylesBackup).toHaveBeenCalledWith('GroupA', 'ClientB', 'Eval1');
      expect(mockToast.success).toHaveBeenLastCalledWith('Restored styles from before the read');
    });

    it('does not report a restore when there is no backup to restore', async () => {
      vi.mocked(readStylesFile).mockResolvedValue({ version: 1 } as any);
      vi.mocked(restoreStylesBackup).mockReturnValue(false);
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      await act(() => lastMenubarProps().onReadStyles());
      const options = mockToast.success.mock.calls[0][1] as any;
      mockToast.success.mockClear();
      await act(() => options.action.onClick());

      expect(restoreStylesBackup).toHaveBeenCalled();
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it('shows the error message when reading an invalid styles file throws an Error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(readStylesFile).mockRejectedValue(new Error('Invalid styles file'));
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      await act(() => lastMenubarProps().onReadStyles());

      expect(mockToast.error).toHaveBeenCalledWith('Invalid styles file');
    });

    it('shows a generic message when reading fails with a non-Error value', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(readStylesFile).mockRejectedValue('unexpected');
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      await act(() => lastMenubarProps().onReadStyles());

      expect(mockToast.error).toHaveBeenCalledWith(`Could not read ${STYLES}`);
    });

    it('does nothing when the delete confirmation is cancelled', async () => {
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      await act(() => lastMenubarProps().onDeleteStyles());
      await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();

      expect(deleteStylesFile).not.toHaveBeenCalled();
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    it('reports a deleted styles file', async () => {
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      await act(() => lastMenubarProps().onDeleteStyles());
      await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();

      expect(deleteStylesFile).toHaveBeenCalledWith(undefined, 'GroupA', 'ClientB', 'Eval1');
      expect(mockToast.success).toHaveBeenCalledWith(`Deleted ${STYLES}`);
    });

    it('reports when there was no styles file to delete', async () => {
      vi.mocked(deleteStylesFile).mockResolvedValue(false);
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      await act(() => lastMenubarProps().onDeleteStyles());
      await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();

      expect(mockToast.success).toHaveBeenCalledWith(`No ${STYLES} to delete`);
    });

    it('reports an error when deleting the styles file fails', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(deleteStylesFile).mockRejectedValue(new Error('locked'));
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      await act(() => lastMenubarProps().onDeleteStyles());
      await page.getByRole('dialog').getByRole('button', { name: 'Delete', exact: true }).click();

      expect(mockToast.error).toHaveBeenCalledWith(`Could not delete ${STYLES}`);
    });
  });

  describe('image export', () => {
    it('saves the figure through saveChartImage using the page name and format', async () => {
      renderPage();
      await expect.element(page.getByTestId('menubar')).toBeInTheDocument();

      lastMenubarProps().onSaveImage('png');

      expect(saveChartImage).toHaveBeenCalledWith(expect.any(HTMLDivElement), 'png', 'rate.png');
    });
  });

  describe('hidden conditions', () => {
    it('removes a hidden condition from the figure sessions and the visible style list', async () => {
      renderPage();
      await expect.element(page.getByTestId('figure')).toBeInTheDocument();
      expect(lastFigureProps().FilteredSessions).toHaveLength(2);

      await act(() =>
        lastMenubarProps().dispatch({ type: 'conditionVisibilityChanged', condition: 'Baseline', visible: false }),
      );

      expect(lastFigureProps().FilteredSessions).toEqual([{ SessionSettings: { Condition: 'Treatment' } }]);
      expect(lastMenubarProps().visibleStyleConditions).not.toContain('Baseline');
    });

    it('keeps sessions whose condition has no matching setting', async () => {
      renderPage({ ResultsFiltered: [{ SessionSettings: { Condition: 'Unlisted' } }] });
      await expect.element(page.getByTestId('figure')).toBeInTheDocument();

      expect(lastFigureProps().FilteredSessions).toHaveLength(1);
    });
  });

  describe('figure', () => {
    it('renders the figure with the page inputs when a DynamicKeySet is provided', async () => {
      renderPage();

      await expect.element(page.getByTestId('figure')).toBeInTheDocument();
      const props = lastFigureProps();
      expect(props.Group).toBe('GroupA');
      expect(props.Individual).toBe('ClientB');
      expect(props.Evaluation).toBe('Eval1');
      expect(props.MinX).toBe(1);
      expect(props.MaxX).toBe(10);
      expect(props.KeySetFull).toHaveLength(2);
      expect(props.FilteredSessions).toHaveLength(2);
    });

    it('does not render the figure without a DynamicKeySet', async () => {
      renderPage({ DynamicKeySet: undefined });

      await expect.element(page.getByText('Rate Title')).toBeVisible();
      await expect.element(page.getByTestId('figure')).not.toBeInTheDocument();
      expect(mockFigure).not.toHaveBeenCalled();
    });
  });
});
