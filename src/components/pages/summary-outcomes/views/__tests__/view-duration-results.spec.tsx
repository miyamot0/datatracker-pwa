import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

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

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => null,
}));

vi.mock('react-spreadsheet', () => ({
  default: ({ columnLabels }: { columnLabels: string[] }) => (
    <div data-testid="spreadsheet">
      {columnLabels?.map((label, i) => (
        <span key={i}>{label}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/lib/calculations', () => ({
  processMultipleSessionDataWithKeys: vi.fn(() => []),
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

import ViewDurationResults from '../view-duration-results';
import { FolderContextProvider } from '@/context/folder-context';

// ----- Helpers -----

const makeKeyset = () =>
  ({
    id: 'ks1',
    Name: 'TestSet',
    FrequencyKeys: [],
    DurationKeys: [{ KeyName: 'C', KeyDescription: 'Crying', KeyCode: 67 }],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
  }) as any;

const makeShowKeys = () => [{ KeyName: 'C', KeyDescription: 'Crying', Visible: true }] as any[];

const defaultProps = {
  SessionTimer: 'End on Timer #1' as any,
  Results: [],
  LatestKeyset: makeKeyset(),
  ShowKeysDuration: makeShowKeys(),
  Group: 'GroupA',
  Individual: 'ClientB',
  Evaluation: 'Eval1',
};

// ----- Tests -----

const renderDur = (props = defaultProps) =>
  render(
    <FolderContextProvider>
      <ViewDurationResults {...props} />
    </FolderContextProvider>,
  );

describe('ViewDurationResults', () => {
  it('renders without crashing', async () => {
    const { container } = await renderDur();
    expect(container).not.toBeNull();
  });

  it('renders the card title', async () => {
    await renderDur();
    await expect.element(page.getByText('Summary of Session Duration Data')).toBeInTheDocument();
  });

  it('renders the card description', async () => {
    await renderDur();
    await expect.element(page.getByText('Key Presses are summarized in the table below')).toBeInTheDocument();
  });

  it('renders the Edit Keys Displayed button', async () => {
    await renderDur();
    await expect.element(page.getByText('Edit Keys Displayed')).toBeInTheDocument();
  });

  it('renders the CSV Download button', async () => {
    await renderDur();
    await expect.element(page.getByText('Download').first()).toBeInTheDocument();
    const downloads = await page.getByText('Download').all();
    expect(downloads.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the spreadsheet', async () => {
    await renderDur();
    await expect.element(page.getByTestId('spreadsheet')).toBeInTheDocument();
  });

  it('renders spreadsheet column labels from matrix[0]', async () => {
    await renderDur();
    await expect.element(page.getByText('Session', { exact: true }).first()).toBeInTheDocument();
    await expect.element(page.getByText('Condition')).toBeInTheDocument();
  });

  it('renders surrounding content where BackButton appears', async () => {
    await renderDur();
    await expect.element(page.getByText('Summary of Session Duration Data')).toBeInTheDocument();
  });

  describe('interactions', () => {
    beforeEach(() => {
      mockSetLocalCachedPrefs.mockReset();
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-duration');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('clicking the CSV Download button calls URL.createObjectURL', async () => {
      await renderDur();
      await expect.element(page.getByRole('button', { name: /download/i }).first()).toBeInTheDocument();
      const downloadBtns = await page.getByRole('button', { name: /download/i }).all();
      await downloadBtns[0].click();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('clicking the JSON Download button calls URL.createObjectURL', async () => {
      await renderDur();
      await expect.element(page.getByRole('button', { name: /download/i }).first()).toBeInTheDocument();
      const downloadBtns = await page.getByRole('button', { name: /download/i }).all();
      await downloadBtns[1].click();
      expect(URL.createObjectURL).toHaveBeenCalled();
    });

    it('clicking Edit Keys Displayed opens the dropdown', async () => {
      await renderDur();
      await page.getByRole('button', { name: /edit keys displayed/i }).click();
      await expect.element(page.getByRole('menuitemcheckbox', { name: 'Crying' })).toBeInTheDocument();
    });

    it('unchecking a key in Edit Keys Displayed calls setLocalCachedPrefs', async () => {
      await renderDur();
      await page.getByRole('button', { name: /edit keys displayed/i }).click();
      await page.getByRole('menuitemcheckbox', { name: 'Crying' }).click();
      expect(mockSetLocalCachedPrefs).toHaveBeenCalled();
    });
  });
});
