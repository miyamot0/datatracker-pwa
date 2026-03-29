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

  it('renders without crashing', () => {
    const { container } = renderWithTabs();
    expect(container).not.toBeNull();
  });

  it('renders the Allow Elevated Privileges label', () => {
    renderWithTabs();
    expect(screen.getByText('Allow Elevated Privileges')).not.toBeNull();
  });

  it('renders the elevated privileges description', () => {
    renderWithTabs();
    expect(screen.getByText(/Display options for copying\/deleting\/renaming records/i)).not.toBeNull();
  });

  it("renders the Enforce 'DataTracker' Folder Name label", () => {
    renderWithTabs();
    expect(screen.getByText("Enforce 'DataTracker' Folder Name")).not.toBeNull();
  });

  it('renders the enforce folder name description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select whether to allow folders named other than/i)).not.toBeNull();
  });

  it('renders the anonymous error logging label', () => {
    renderWithTabs();
    expect(screen.getByText('Contribute Anonymous Error Logging')).not.toBeNull();
  });

  it('renders the analytics consent description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select whether to allow anonymous error logging/i)).not.toBeNull();
  });

  it('renders three Select triggers', () => {
    renderWithTabs();
    // Each SettingsFormItemWrapper adds one SelectTrigger
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
          <Tabs defaultValue={SettingsDisplayEnum.Admin}>
            <SettingsTabAdministrative />
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
      mockSetConsent.mockReset();
    });

    it('selecting Allow elevated privileges calls setSettings with EnableFileDeletion: true', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      const triggers = screen.getAllByRole('combobox');
      await user.click(triggers[0]);
      await user.click(screen.getByRole('option', { name: 'Allow' }));
      expect(mockSetSettings).toHaveBeenCalledWith(
        expect.objectContaining({ EnableFileDeletion: true }),
      );
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Disable Requirements calls setSettings with EnforceDataFolderName: false', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      const triggers = screen.getAllByRole('combobox');
      await user.click(triggers[1]);
      await user.click(screen.getByRole('option', { name: 'Disable Requirements' }));
      expect(mockSetSettings).toHaveBeenCalledWith(
        expect.objectContaining({ EnforceDataFolderName: false }),
      );
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Allow anonymous error logs calls setConsent with granted', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      const triggers = screen.getAllByRole('combobox');
      await user.click(triggers[2]);
      await user.click(screen.getByRole('option', { name: 'Allow anonymous error logs' }));
      expect(mockSetConsent).toHaveBeenCalledWith('granted');
    });
  });
});
