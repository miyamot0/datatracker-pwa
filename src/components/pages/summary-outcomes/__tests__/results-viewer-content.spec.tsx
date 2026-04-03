import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';

const mockFilteredSessionScoringOptions = vi.hoisted(() => vi.fn());

vi.mock('@/components/ui/select', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/components/ui/select')>();
  return {
    ...actual,
    Select: ({ value, onValueChange, children }: any) => (
      <div>
        <div data-testid={`select-value-${String(value)}`}>{String(value)}</div>
        {value === 'Primary' || value === 'Reliability' ? (
          <>
            <button onClick={() => onValueChange('Primary')}>Set Primary Role</button>
            <button onClick={() => onValueChange('Reliability')}>Set Reliability Role</button>
          </>
        ) : (
          <>
            <button onClick={() => onValueChange('End on Timer #1')}>Set Fixed Schedule</button>
            <button onClick={() => onValueChange('Score by Special')}>Set Special Schedule</button>
            <button onClick={() => onValueChange('Unknown Value')}>Set Unknown Schedule</button>
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

vi.mock('../views/view-frequency-results', () => ({
  default: ({ SessionTimer, Results }: any) => (
    <div data-testid="freq-view">
      freq:{SessionTimer}:{Results.map((r: any) => r.SessionSettings.Session).join(',')}
    </div>
  ),
}));

vi.mock('../views/view-duration-results', () => ({
  default: ({ SessionTimer, Results }: any) => (
    <div data-testid="dur-view">
      dur:{SessionTimer}:{Results.map((r: any) => r.SessionSettings.Session).join(',')}
    </div>
  ),
}));

vi.mock('@/types/schedules', () => ({
  ScheduleMappingOptions: [
    { value: 'End on Primary Timer', label: 'Score Total Time' },
    { value: 'End on Timer #1', label: 'Score Timer #1 Time' },
  ],
  filteredSessionScoringOptions: mockFilteredSessionScoringOptions,
}));

import ResultsViewerContent from '../results-viewer-content';

const settings = {
  TimerTwoDisplay: 'show',
  TimerThreeDisplay: 'hide',
} as any;

const keysetWithBoth = {
  Name: 'SetA',
  FrequencyKeys: [{ KeyName: 'a', KeyDescription: 'Aggression' }],
  DurationKeys: [{ KeyName: 'd', KeyDescription: 'Duration' }],
  SpecialDurationKeys: [{ KeyName: 's', KeyDescription: 'Special' }],
  ScorableDurationKeys: [{ KeyName: 's', KeyDescription: 'Special' }],
} as any;

const baseResults = [
  { SessionSettings: { Session: 3, Role: 'Reliability' } },
  { SessionSettings: { Session: 2, Role: 'Primary' } },
  { SessionSettings: { Session: 1, Role: 'Primary' } },
] as any;

const renderPage = (props?: Partial<ComponentProps<typeof ResultsViewerContent>>) =>
  render(
    <ResultsViewerContent
      TimerMapping={{ value: 'End on Primary Timer', label: 'Score Total Time' }}
      Results={baseResults}
      Keyset={keysetWithBoth}
      Group="GroupA"
      Individual="ClientB"
      Evaluation="Eval1"
      ShowKeysFreq={[] as any}
      ShowKeysDuration={[] as any}
      Settings={settings}
      {...props}
    />,
  );

describe('ResultsViewerContent', () => {
  beforeEach(() => {
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

  it('renders filters and initially shows sorted primary results in both result views', async () => {
    await renderPage();

    await expect.element(page.getByText('Filter by Data Collector:')).toBeInTheDocument();
    await expect.element(page.getByText('Score By Schedule:')).toBeInTheDocument();
    await expect.element(page.getByTestId('freq-view')).toHaveTextContent('freq:End on Primary Timer:1,2');
    await expect.element(page.getByTestId('dur-view')).toHaveTextContent('dur:End on Primary Timer:1,2');
  });

  it('changes role to reliability and filters downstream result views', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Set Reliability Role' }).click();

    await expect.element(page.getByTestId('freq-view')).toHaveTextContent('freq:End on Primary Timer:3');
    await expect.element(page.getByTestId('dur-view')).toHaveTextContent('dur:End on Primary Timer:3');
  });

  it('changes schedule to fixed mapping option and keeps duration visible', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Set Fixed Schedule' }).click();

    await expect.element(page.getByTestId('freq-view')).toHaveTextContent('freq:End on Timer #1:1,2');
    await expect.element(page.getByTestId('dur-view')).toHaveTextContent('dur:End on Timer #1:1,2');
  });

  it('changes schedule to special key option and hides duration view', async () => {
    await renderPage();

    await page.getByRole('button', { name: 'Set Special Schedule' }).click();

    await expect.element(page.getByTestId('freq-view')).toHaveTextContent('freq:Score by Special:1,2');
    expect(await page.getByTestId('dur-view').query()).toBeNull();
  });

  it('ignores unknown schedule and keeps previous state', async () => {
    await renderPage();
    await page.getByRole('button', { name: 'Set Fixed Schedule' }).click();

    await page.getByRole('button', { name: 'Set Unknown Schedule' }).click();

    await expect.element(page.getByTestId('freq-view')).toHaveTextContent('freq:End on Timer #1:1,2');
    await expect.element(page.getByTestId('dur-view')).toHaveTextContent('dur:End on Timer #1:1,2');
  });

  it('hides frequency and duration views when key arrays are empty', async () => {
    await renderPage({
      Keyset: {
        ...keysetWithBoth,
        FrequencyKeys: [],
        DurationKeys: [],
      } as any,
    });

    expect(await page.getByTestId('freq-view').query()).toBeNull();
    expect(await page.getByTestId('dur-view').query()).toBeNull();
  });
});
