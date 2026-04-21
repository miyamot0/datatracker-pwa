import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSetLocalCachedPrefs = vi.hoisted(() => vi.fn());
const mockFilteredSessionScoringOptions = vi.hoisted(() => vi.fn());

vi.mock('@/lib/local_storage', () => ({
  setLocalCachedPrefs: mockSetLocalCachedPrefs,
}));

vi.mock('@/types/schedules', () => ({
  ScheduleMappingOptions: [
    { value: 'End on Primary Timer', label: 'Score Total Time' },
    { value: 'End on Timer #1', label: 'Score Timer #1 Time' },
  ],
  filteredSessionScoringOptions: mockFilteredSessionScoringOptions,
}));

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, params, children }: any) => (
    <a href={to} data-params={params ? JSON.stringify(params) : undefined}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuCheckboxItem: ({ children, checked, onCheckedChange }: any) => (
    <button onClick={() => onCheckedChange(!checked)}>{children}</button>
  ),
}));

vi.mock('@/components/ui/select', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/select')>();
  return {
    ...actual,
    Select: ({ value, onValueChange, children }: any) => (
      <div>
        <div data-testid={`select-value-${String(value)}`}>{String(value)}</div>
        {String(value).startsWith('End on') || String(value).startsWith('Score by') ? (
          <>
            <button onClick={() => onValueChange('End on Timer #1')}>Set Fixed Schedule</button>
            <button onClick={() => onValueChange('Score by Special')}>Set Special Schedule</button>
            <button onClick={() => onValueChange('Unknown Value')}>Set Unknown Schedule</button>
          </>
        ) : (
          <>
            <button onClick={() => onValueChange('large')}>Set Figure Large</button>
            <button onClick={() => onValueChange('extraLarge')}>Set Figure Extra Large</button>
          </>
        )}
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

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <button onClick={() => onCheckedChange(!checked)}>Switch:{String(checked)}</button>
  ),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => <div>Back</div>,
}));

vi.mock('../rate-figure', () => ({
  default: ({ ScheduleOption, KeySetFull, FigureTextSize, ConnectSpans, FilteredSessions }: any) => (
    <div data-testid="rate-figure">
      <span data-testid="figure-schedule">{ScheduleOption}</span>
      <span data-testid="figure-visible-keys">{KeySetFull.filter((k: any) => k.Visible).length}</span>
      <span data-testid="figure-text-size">{FigureTextSize}</span>
      <span data-testid="figure-connect">{String(ConnectSpans)}</span>
      <span data-testid="first-key-type">{KeySetFull[0]?.KeyType}</span>
      <span data-testid="figure-session-count">{FilteredSessions.length}</span>
    </div>
  ),
}));

import ResultsRateVisualsPage from '../results-rate-visuals-page';

const makeProps = () =>
  ({
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
      SpecialDurationKeys: [{ KeyDescription: 'Special', KeyName: 's' }],
      ScorableDurationKeys: [{ KeyDescription: 'Special', KeyName: 's' }],
    },
    ResultsFiltered: [{ SessionSettings: { Condition: 'Baseline' } }, { SessionSettings: { Condition: 'Treatment' } }],
    TimerMapping: { value: 'End on Primary Timer', label: 'Score Total Time' },
    MinX: 1,
    MaxX: 10,
    Settings: {
      TimerTwoDisplay: 'show',
      TimerThreeDisplay: 'hide',
    },
  }) as any;

const renderPage = (override?: Record<string, unknown>) =>
  render(<ResultsRateVisualsPage {...makeProps()} {...override} />);

describe('ResultsRateVisualsPage', () => {
  beforeEach(() => {
    mockSetLocalCachedPrefs.mockReset();
    mockFilteredSessionScoringOptions.mockReset();
    mockFilteredSessionScoringOptions.mockImplementation((_s: unknown, _k: unknown, filterMain: boolean) => {
      if (filterMain) {
        return [
          { value: 'End on Timer #1', label: 'Score Timer #1 Time' },
          { value: 'Score by Special', label: 'Score by Special' },
        ];
      }

      return [{ value: 'Score by Special', label: 'Score by Special' }];
    });
  });

  it('renders headings, controls, navigation, and initial figure state', async () => {
    await renderPage();

    await expect.element(page.getByText('Visualization of Behavioral Rates')).toBeInTheDocument();
    await expect.element(page.getByRole('link', { name: 'See Proportion' })).toBeInTheDocument();
    await expect.element(page.getByText('Edit Keys Displayed')).toBeInTheDocument();
    await expect.element(page.getByText('Edit Conditions Displayed')).toBeInTheDocument();
    await expect.element(page.getByText('Timer to Reference:')).toBeInTheDocument();
    await expect.element(page.getByText('Element Magnification:')).toBeInTheDocument();
    await expect.element(page.getByText('Connect All Spans:')).toBeInTheDocument();
    await expect.element(page.getByTestId('figure-schedule')).toHaveTextContent('End on Primary Timer');
    await expect.element(page.getByTestId('figure-visible-keys')).toHaveTextContent('2');
    await expect.element(page.getByTestId('figure-text-size')).toHaveTextContent('base');
    await expect.element(page.getByTestId('figure-connect')).toHaveTextContent('false');
    await expect.element(page.getByTestId('figure-session-count')).toHaveTextContent('2');
  });

  it('sorts key display order by key type and renders derived marker', async () => {
    await renderPage();

    await expect.element(page.getByTestId('first-key-type')).toHaveTextContent('Observed');
    await expect.element(page.getByText('(Derived)')).toBeInTheDocument();
  });

  it('updates schedule to fixed and special options', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Set Fixed Schedule' }).click();
    await expect.element(page.getByTestId('figure-schedule')).toHaveTextContent('End on Timer #1');

    await page.getByRole('button', { name: 'Set Special Schedule' }).click();
    await expect.element(page.getByTestId('figure-schedule')).toHaveTextContent('Score by Special');
  });

  it('ignores unknown schedule values and keeps existing schedule', async () => {
    await renderPage();
    await page.getByRole('button', { name: 'Set Fixed Schedule' }).click();

    await page.getByRole('button', { name: 'Set Unknown Schedule' }).click();

    await expect.element(page.getByTestId('figure-schedule')).toHaveTextContent('End on Timer #1');
  });

  it('toggles key visibility and stores local preferences with Rate scope', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Aggression' }).click();

    expect(mockSetLocalCachedPrefs).toHaveBeenCalledWith('GroupA', 'ClientB', 'Eval1', 'Rate', {
      KeyDescription: ['Aggression'],
      Schedule: 'End on Primary Timer',
    });
    await expect.element(page.getByTestId('figure-visible-keys')).toHaveTextContent('1');
  });

  it('updates figure text size and connect spans state', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Set Figure Large' }).click();
    await page.getByRole('button', { name: 'Switch:false' }).click();

    await expect.element(page.getByTestId('figure-text-size')).toHaveTextContent('large');
    await expect.element(page.getByTestId('figure-connect')).toHaveTextContent('true');
  });

  it('does not render figure when keyset is missing', async () => {
    await renderPage({ DynamicKeySet: undefined });

    expect(await page.getByTestId('rate-figure').query()).toBeNull();
  });

  it('renders condition names in the Edit Conditions Displayed dropdown', async () => {
    await renderPage();

    await expect.element(page.getByRole('button', { name: 'Baseline' })).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Treatment' })).toBeInTheDocument();
  });

  it('toggles a condition off and reduces sessions passed to the figure', async () => {
    await renderPage();

    await expect.element(page.getByTestId('figure-session-count')).toHaveTextContent('2');

    await page.getByRole('button', { name: 'Baseline' }).click();

    await expect.element(page.getByTestId('figure-session-count')).toHaveTextContent('1');
  });

  it('toggles multiple conditions off and then back on', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Baseline' }).click();
    await page.getByRole('button', { name: 'Treatment' }).click();
    await expect.element(page.getByTestId('figure-session-count')).toHaveTextContent('0');

    await page.getByRole('button', { name: 'Baseline' }).click();
    await expect.element(page.getByTestId('figure-session-count')).toHaveTextContent('1');
  });
});
