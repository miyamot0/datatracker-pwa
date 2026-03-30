import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

const mockPreventDefaultFrequency = vi.hoisted(() => vi.fn());
const mockProcessFrequency = vi.hoisted(() => vi.fn(() => []));

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
  Link: ({ children }: any) => <a>{children}</a>,
}));

vi.mock('@tanstack/react-hotkeys', () => ({
  useHotkey: vi.fn(),
}));

vi.mock('@/components/ui/back-button', () => ({
  default: () => null,
}));

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => null,
}));

vi.mock('react-spreadsheet', () => ({
  default: ({
    columnLabels,
    onKeyDown,
  }: {
    columnLabels: string[];
    onKeyDown?: (ev: { key: string; preventDefault: () => void }) => void;
  }) => (
    <div data-testid="spreadsheet">
      {columnLabels?.map((label, i) => (
        <span key={i}>{label}</span>
      ))}
      <button
        onClick={() =>
          onKeyDown?.({
            key: 'v',
            preventDefault: mockPreventDefaultFrequency,
          })
        }
      >
        Trigger V Key
      </button>
      <button
        onClick={() =>
          onKeyDown?.({
            key: 'x',
            preventDefault: mockPreventDefaultFrequency,
          })
        }
      >
        Trigger X Key
      </button>
    </div>
  ),
}));

vi.mock('@/lib/calculations', () => ({
  processMultipleSessionDataWithKeys: mockProcessFrequency,
}));

vi.mock('@/lib/calculations/calculation-helpers', () => ({
  convertLegacyTimerType: vi.fn(() => 'Total'),
}));

vi.mock('@/lib/calculations/calculation-formatting', () => ({
  formatForSpreadsheet: vi.fn(() => [
    ['Session', 'Condition'],
    ['1', 'Baseline'],
  ]),
}));

const mockSetLocalCachedPrefs = vi.hoisted(() => vi.fn());
vi.mock('@/lib/local_storage', () => ({
  setLocalCachedPrefs: mockSetLocalCachedPrefs,
}));

// ----- Import under test -----

import ViewFrequencyResults from '../view-frequency-results';
import { FolderContextProvider } from '@/context/folder-context';

// ----- Helpers -----

const makeKeyset = () =>
  ({
    id: 'ks1',
    Name: 'TestSet',
    FrequencyKeys: [
      { KeyName: 'A', KeyDescription: 'Hitting', KeyCode: 65 },
      { KeyName: 'B', KeyDescription: 'Biting', KeyCode: 66 },
    ],
    DurationKeys: [],
    DerivedKeys: [{ id: 'd1', name: 'Derived One' }],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
  }) as any;

const makeShowKeys = () =>
  [
    { KeyName: 'A', KeyDescription: 'Hitting', Visible: true },
    { KeyName: 'B', KeyDescription: 'Biting', Visible: true },
    { KeyName: 'DERIVED', KeyDescription: 'Derived One', Visible: true },
  ] as any[];

const defaultProps = {
  SessionTimer: 'End on Timer #1' as any,
  Results: [],
  LatestKeyset: makeKeyset(),
  ShowKeysFreq: makeShowKeys(),
  Group: 'GroupA',
  Individual: 'ClientB',
  Evaluation: 'Eval1',
};

// ----- Tests -----

const renderFreq = (props = defaultProps) =>
  render(
    <FolderContextProvider>
      <ViewFrequencyResults {...props} />
    </FolderContextProvider>,
  );

describe('ViewFrequencyResults', () => {
  it('renders without crashing', async () => {
    const { container } = await renderFreq();
    expect(container).not.toBeNull();
  });

  it('renders the card title', async () => {
    await renderFreq();
    await expect.element(page.getByText('Summary of Session Frequency Data')).toBeInTheDocument();
  });

  it('renders the card description', async () => {
    await renderFreq();
    await expect.element(page.getByText('Key Presses are summarized in the table below')).toBeInTheDocument();
  });

  it('renders the Edit Keys Displayed button', async () => {
    await renderFreq();
    await expect.element(page.getByText('Edit Keys Displayed')).toBeInTheDocument();
  });

  it('renders CSV and JSON Download buttons', async () => {
    await renderFreq();
    await expect.element(page.getByText('Download').first()).toBeInTheDocument();
    const downloads = await page.getByText('Download').all();
    expect(downloads.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the spreadsheet', async () => {
    await renderFreq();
    await expect.element(page.getByTestId('spreadsheet')).toBeInTheDocument();
  });

  it('renders spreadsheet column labels from matrix[0]', async () => {
    await renderFreq();
    await expect.element(page.getByText('Session', { exact: true }).first()).toBeInTheDocument();
    await expect.element(page.getByText('Condition')).toBeInTheDocument();
  });

  it('renders surrounding content where BackButton appears', async () => {
    await renderFreq();
    await expect.element(page.getByText('Summary of Session Frequency Data')).toBeInTheDocument();
  });

  describe('interactions', () => {
    beforeEach(() => {
      mockSetLocalCachedPrefs.mockReset();
      mockProcessFrequency.mockClear();
      mockPreventDefaultFrequency.mockReset();
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-frequency');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('clicking the CSV Download button calls URL.createObjectURL', async () => {
      await renderFreq();
      await expect.element(page.getByRole('button', { name: /download/i }).first()).toBeInTheDocument();
      const downloadBtns = await page.getByRole('button', { name: /download/i }).all();
      await downloadBtns[0].click();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('clicking the JSON Download button calls URL.createObjectURL', async () => {
      await renderFreq();
      await expect.element(page.getByRole('button', { name: /download/i }).first()).toBeInTheDocument();
      const downloadBtns = await page.getByRole('button', { name: /download/i }).all();
      await downloadBtns[1].click();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('clicking Edit Keys Displayed opens the dropdown', async () => {
      await renderFreq();
      await page.getByRole('button', { name: /edit keys displayed/i }).click();
      await expect.element(page.getByRole('menuitemcheckbox', { name: 'Hitting' })).toBeInTheDocument();
    });

    it('unchecking a key in Edit Keys Displayed calls setLocalCachedPrefs', async () => {
      await renderFreq();
      await page.getByRole('button', { name: /edit keys displayed/i }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Hitting' }).click();
      expect(mockSetLocalCachedPrefs).toHaveBeenCalled();
    });

    it('pressing v on spreadsheet prevents default and non-v does not', async () => {
      await renderFreq();
      await page.getByRole('button', { name: 'Trigger V Key' }).click();
      expect(mockPreventDefaultFrequency).toHaveBeenCalledTimes(1);

      await page.getByRole('button', { name: 'Trigger X Key' }).click();
      expect(mockPreventDefaultFrequency).toHaveBeenCalledTimes(1);
    });

    it('retains untouched key entries when toggling one frequency key', async () => {
      await renderFreq();
      await page.getByRole('button', { name: /edit keys displayed/i }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Hitting' }).click();

      const lastCall = mockSetLocalCachedPrefs.mock.calls.at(-1);
      expect(lastCall[4]).toEqual(
        expect.objectContaining({
          KeyDescription: ['Hitting'],
        }),
      );
    });

    it('filters derived keys using show-key descriptions', async () => {
      await renderFreq();

      const calcArg = mockProcessFrequency.mock.calls[0]?.[4];
      expect(calcArg.derivedKeys).toEqual([]);
    });

    it('includes keys when matching display config is hidden (Visible=false)', async () => {
      await renderFreq({
        ...defaultProps,
        ShowKeysFreq: [
          { KeyName: 'A', KeyDescription: 'Hitting', Visible: false },
          { KeyName: 'DERIVED', KeyDescription: 'Derived One', Visible: false },
        ] as any,
      });

      const calcArg = mockProcessFrequency.mock.calls[0]?.[4];
      expect(calcArg.frequencyKeys).toEqual([expect.objectContaining({ KeyName: 'A' })]);
      expect(calcArg.derivedKeys).toEqual([expect.objectContaining({ name: 'Derived One' })]);
    });

    it('falls back to false when keys have no matching display config', async () => {
      await renderFreq({
        ...defaultProps,
        ShowKeysFreq: [{ KeyName: 'A', KeyDescription: 'Hitting', Visible: true }] as any,
      });

      const calcArg = mockProcessFrequency.mock.calls[0]?.[4];
      expect(calcArg.frequencyKeys).toEqual([]);
      expect(calcArg.derivedKeys).toEqual([]);
    });
  });
});
