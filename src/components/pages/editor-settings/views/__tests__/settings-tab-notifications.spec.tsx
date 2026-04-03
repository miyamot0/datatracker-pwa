import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Module mocks -----

vi.mock('@/App', () => ({
  queryClient: {
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    setDefaultOptions: vi.fn(),
  },
}));

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: vi.fn(),
}));

// ----- Import under test -----

import { Tabs } from '@/components/ui/tabs';
import { SettingsTabNotifications } from '../settings-tab-notifications';
import { DEFAULT_APPLICATION_SETTINGS, SettingsDisplayEnum } from '@/types/settings/application-settings';
import { FolderHandleContext } from '@/context/folder-context';

// ----- Tests -----

describe('SettingsTabNotifications', () => {
  const renderWithTabs = () =>
    render(
      <Tabs defaultValue={SettingsDisplayEnum.Notifications}>
        <SettingsTabNotifications />
      </Tabs>,
    );

  it('renders without crashing', async () => {
    const { container } = await renderWithTabs();
    expect(container).not.toBeNull();
  });

  it('renders the Notification Level label', async () => {
    await renderWithTabs();
    await expect.element(page.getByText('Notification Level')).toBeInTheDocument();
  });

  it('renders the notification level description', async () => {
    await renderWithTabs();
    await expect.element(page.getByText(/Select the range and types of notifications provided/i)).toBeInTheDocument();
  });

  it('renders the Visual Tooltip Level label', async () => {
    await renderWithTabs();
    await expect.element(page.getByText('Visual Tooltip Level')).toBeInTheDocument();
  });

  it('renders the tooltip level description', async () => {
    await renderWithTabs();
    await expect.element(page.getByText(/Select the range and level of visual tooltips provided/i)).toBeInTheDocument();
  });

  it('renders two Select triggers', async () => {
    await renderWithTabs();
    await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
    const triggers = await page.getByRole('combobox').all();
    expect(triggers).toHaveLength(2);
  });

  describe('select interactions', () => {
    const mockSetSettings = vi.fn();
    const mockSaveSettings = vi.fn();

    const renderWithProvider = (settingsOverride?: Partial<typeof DEFAULT_APPLICATION_SETTINGS>) =>
      render(
        <FolderHandleContext.Provider
          value={{
            settings: {
              ...DEFAULT_APPLICATION_SETTINGS,
              ...settingsOverride,
            },
            setSettings: mockSetSettings,
            saveSettings: mockSaveSettings,
            handle: undefined,
            setHandle: vi.fn(),
            isInitialized: false,
            setIsInitialized: vi.fn(),
          }}
        >
          <Tabs defaultValue={SettingsDisplayEnum.Notifications}>
            <SettingsTabNotifications />
          </Tabs>
        </FolderHandleContext.Provider>,
      );

    beforeEach(() => {
      mockSetSettings.mockReset();
      mockSaveSettings.mockReset();
    });

    it('selecting Show Errors Only calls setSettings with updated NotificationSettings', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[0].click();
      await page.getByRole('option', { name: 'Show Errors Only' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ NotificationSettings: 'ShowErrorsOnly' }));
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Disable Tooltips calls setSettings with EnableToolTip: false', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[1].click();
      await page.getByRole('option', { name: 'Disable Tooltips' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ EnableToolTip: false }));
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Show All Tooltips calls setSettings with EnableToolTip: true', async () => {
      await renderWithProvider({ EnableToolTip: false });
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[1].click();
      await page.getByRole('option', { name: 'Show All Tooltips' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ EnableToolTip: true }));
      expect(mockSaveSettings).toHaveBeenCalled();
    });
  });
});
