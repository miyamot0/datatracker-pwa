import React from 'react';
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
import { SettingsTabNotifications } from '../settings-tab-notifications';
import { DEFAULT_APPLICATION_SETTINGS, SettingsDisplayEnum } from '@/types/settings';
import { FolderHandleContext } from '@/context/folder-context';

// ----- Tests -----

describe('SettingsTabNotifications', () => {
  const renderWithTabs = () =>
    render(
      <Tabs defaultValue={SettingsDisplayEnum.Notifications}>
        <SettingsTabNotifications />
      </Tabs>,
    );

  it('renders without crashing', () => {
    const { container } = renderWithTabs();
    expect(container).not.toBeNull();
  });

  it('renders the Notification Level label', () => {
    renderWithTabs();
    expect(screen.getByText('Notification Level')).not.toBeNull();
  });

  it('renders the notification level description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select the range and types of notifications provided/i)).not.toBeNull();
  });

  it('renders the Visual Tooltip Level label', () => {
    renderWithTabs();
    expect(screen.getByText('Visual Tooltip Level')).not.toBeNull();
  });

  it('renders the tooltip level description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select the range and level of visual tooltips provided/i)).not.toBeNull();
  });

  it('renders two Select triggers', () => {
    renderWithTabs();
    const triggers = screen.getAllByRole('combobox');
    expect(triggers.length).toBe(2);
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
          <Tabs defaultValue={SettingsDisplayEnum.Notifications}>
            <SettingsTabNotifications />
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

    it('selecting Show Errors Only calls setSettings with updated NotificationSettings', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      const triggers = screen.getAllByRole('combobox');
      await user.click(triggers[0]);
      await user.click(screen.getByRole('option', { name: 'Show Errors Only' }));
      expect(mockSetSettings).toHaveBeenCalledWith(
        expect.objectContaining({ NotificationSettings: 'ShowErrorsOnly' }),
      );
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Disable Tooltips calls setSettings with EnableToolTip: false', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      const triggers = screen.getAllByRole('combobox');
      await user.click(triggers[1]);
      await user.click(screen.getByRole('option', { name: 'Disable Tooltips' }));
      expect(mockSetSettings).toHaveBeenCalledWith(
        expect.objectContaining({ EnableToolTip: false }),
      );
      expect(mockSaveSettings).toHaveBeenCalled();
    });
  });
});
