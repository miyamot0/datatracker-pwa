import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    setDefaultOptions: vi.fn(),
  },
}));

const mockSetConsent = vi.hoisted(() => vi.fn());
vi.mock('@/lib/analytics/analytics-consent', () => ({
  getConsent: vi.fn(() => 'denied'),
  setConsent: mockSetConsent,
}));

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: vi.fn(),
}));

// ----- Import under test -----

import { Tabs } from '@/components/ui/tabs';
import { SettingsTabAdministrative } from '../settings-tab-admin';
import { DEFAULT_APPLICATION_SETTINGS, SettingsDisplayEnum } from '@/types/settings';
import { FolderHandleContext } from '@/context/folder-context';

// ----- Tests -----

describe('SettingsTabAdministrative', () => {
  const renderWithTabs = () =>
    render(
      <Tabs defaultValue={SettingsDisplayEnum.Admin}>
        <SettingsTabAdministrative />
      </Tabs>,
    );

  it('renders without crashing', async () => {
    const { container } = await renderWithTabs();
    expect(container).not.toBeNull();
  });

  it('renders the Allow Elevated Privileges label', async () => {
    await renderWithTabs();
    await expect.element(page.getByText('Allow Elevated Privileges')).toBeInTheDocument();
  });

  it('renders the elevated privileges description', async () => {
    await renderWithTabs();
    await expect
      .element(page.getByText(/Display options for copying\/deleting\/renaming records/i))
      .toBeInTheDocument();
  });

  it("renders the Enforce 'DataTracker' Folder Name label", async () => {
    await renderWithTabs();
    await expect.element(page.getByText("Enforce 'DataTracker' Folder Name")).toBeInTheDocument();
  });

  it('renders the enforce folder name description', async () => {
    await renderWithTabs();
    await expect.element(page.getByText(/Select whether to allow folders named other than/i)).toBeInTheDocument();
  });

  it('renders the anonymous error logging label', async () => {
    await renderWithTabs();
    await expect.element(page.getByText('Contribute Anonymous Error Logging')).toBeInTheDocument();
  });

  it('renders the analytics consent description', async () => {
    await renderWithTabs();
    await expect.element(page.getByText(/Select whether to allow anonymous error logging/i)).toBeInTheDocument();
  });

  it('renders three Select triggers', async () => {
    await renderWithTabs();
    await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
    const triggers = await page.getByRole('combobox').all();
    expect(triggers).toHaveLength(3);
  });

  describe('select interactions', () => {
    const mockSetSettings = vi.fn();
    const mockSaveSettings = vi.fn();

    const renderWithProvider = () =>
      render(
        <FolderHandleContext.Provider
          value={{
            settings: DEFAULT_APPLICATION_SETTINGS,
            setSettings: mockSetSettings,
            saveSettings: mockSaveSettings,
            handle: undefined,
            setHandle: vi.fn(),
            isInitialized: false,
            setIsInitialized: vi.fn(),
          }}
        >
          <Tabs defaultValue={SettingsDisplayEnum.Admin}>
            <SettingsTabAdministrative />
          </Tabs>
        </FolderHandleContext.Provider>,
      );

    beforeEach(() => {
      mockSetSettings.mockReset();
      mockSaveSettings.mockReset();
      mockSetConsent.mockReset();
    });

    it('selecting Allow elevated privileges calls setSettings with EnableFileDeletion: true', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[0].click();
      await page.getByRole('option', { name: 'Allow' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ EnableFileDeletion: true }));
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Disable Requirements calls setSettings with EnforceDataFolderName: false', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[1].click();
      await page.getByRole('option', { name: 'Disable Requirements' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ EnforceDataFolderName: false }));
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Allow anonymous error logs calls setConsent with granted', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[2].click();
      await page.getByRole('option', { name: 'Allow anonymous error logs' }).click();
      expect(mockSetConsent).toHaveBeenCalledWith('granted');
    });
  });
});
