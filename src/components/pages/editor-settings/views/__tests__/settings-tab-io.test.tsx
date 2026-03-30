import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

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

  it('renders without crashing', () => {
    const { container } = renderWithTabs();
    expect(container).not.toBeNull();
  });

  it('renders the Records Caching label', () => {
    renderWithTabs();
    expect(screen.getByText('Records Caching')).not.toBeNull();
  });

  it('renders the records caching description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select how aggressively to cache records/i)).not.toBeNull();
  });

  it('renders the Session Recorder Rendering label', () => {
    renderWithTabs();
    expect(screen.getByText('Session Recorder Rendering')).not.toBeNull();
  });

  it('renders the session recorder description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select the frequency of UI updates/i)).not.toBeNull();
  });

  it('renders the Post-Session Program Behavior label', () => {
    renderWithTabs();
    expect(screen.getByText('Post-Session Program Behavior')).not.toBeNull();
  });

  it('renders the post-session description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select how you wish the program to behave after recording sessions/i)).not.toBeNull();
  });

  it('renders three Select triggers', () => {
    renderWithTabs();
    const triggers = screen.getAllByRole('combobox');
    expect(triggers.length).toBe(3);
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

    beforeAll(() => {
      global.ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
      Element.prototype.hasPointerCapture = vi.fn(() => false);
      Element.prototype.setPointerCapture = vi.fn();
      Element.prototype.releasePointerCapture = vi.fn();
      Element.prototype.scrollIntoView = vi.fn();
    });

    beforeEach(() => {
      mockSetSettings.mockReset();
      mockSaveSettings.mockReset();
    });

    it('selecting Aggressive Caching calls setSettings with updated CacheBehavior', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      const triggers = screen.getAllByRole('combobox');
      await user.click(triggers[0]);
      await user.click(screen.getByRole('option', { name: 'Aggressive Caching' }));
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ CacheBehavior: 'aggressive' }));
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Precise polling calls setSettings with updated RecorderPolling', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      const triggers = screen.getAllByRole('combobox');
      await user.click(triggers[1]);
      await user.click(screen.getByRole('option', { name: 'Precise (25ms)' }));
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ RecorderPolling: 'precise' }));
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Auto Advance calls setSettings with updated PostSessionBx', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      const triggers = screen.getAllByRole('combobox');
      await user.click(triggers[2]);
      await user.click(screen.getByRole('option', { name: 'Auto Advance' }));
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ PostSessionBx: 'AutoAdvance' }));
      expect(mockSaveSettings).toHaveBeenCalled();
    });
  });
});
