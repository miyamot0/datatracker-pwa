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
import { SettingsTabIO } from '../settings-tab-io';
import { DEFAULT_APPLICATION_SETTINGS, SettingsDisplayEnum } from '@/types/settings';
import { FolderHandleContext } from '@/context/folder-context';

// ----- Tests -----

describe('SettingsTabIO', () => {
  const renderWithTabs = () =>
    render(
      <Tabs defaultValue={SettingsDisplayEnum.File}>
        <SettingsTabIO />
      </Tabs>,
    );

  it('renders without crashing', async () => {
    const { container } = await renderWithTabs();
    expect(container).not.toBeNull();
  });

  it('renders the Records Caching label', async () => {
    await renderWithTabs();
    await expect.element(page.getByText('Records Caching')).toBeInTheDocument();
  });

  it('renders the records caching description', async () => {
    await renderWithTabs();
    await expect.element(page.getByText(/Select how aggressively to cache records/i)).toBeInTheDocument();
  });

  it('renders the Session Recorder Rendering label', async () => {
    await renderWithTabs();
    await expect.element(page.getByText('Session Recorder Rendering')).toBeInTheDocument();
  });

  it('renders the session recorder description', async () => {
    await renderWithTabs();
    await expect.element(page.getByText(/Select the frequency of UI updates/i)).toBeInTheDocument();
  });

  it('renders the Post-Session Program Behavior label', async () => {
    await renderWithTabs();
    await expect.element(page.getByText('Post-Session Program Behavior')).toBeInTheDocument();
  });

  it('renders the post-session description', async () => {
    await renderWithTabs();
    await expect
      .element(page.getByText(/Select how you wish the program to behave after recording sessions/i))
      .toBeInTheDocument();
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
          <Tabs defaultValue={SettingsDisplayEnum.File}>
            <SettingsTabIO />
          </Tabs>
        </FolderHandleContext.Provider>,
      );

    beforeEach(() => {
      mockSetSettings.mockReset();
      mockSaveSettings.mockReset();
    });

    it('selecting Aggressive Caching calls setSettings with updated CacheBehavior', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[0].click();
      await page.getByRole('option', { name: 'Aggressive Caching' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ CacheBehavior: 'aggressive' }));
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Precise polling calls setSettings with updated RecorderPolling', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[1].click();
      await page.getByRole('option', { name: 'Precise (25ms)' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ RecorderPolling: 'precise' }));
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Auto Advance calls setSettings with updated PostSessionBx', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[2].click();
      await page.getByRole('option', { name: 'Auto Advance' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ PostSessionBx: 'AutoAdvance' }));
      expect(mockSaveSettings).toHaveBeenCalled();
    });
  });
});
