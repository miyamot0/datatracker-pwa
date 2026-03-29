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

vi.mock('@tanstack/react-router', () => ({
  useRouter: vi.fn(() => ({
    options: { defaultViewTransition: undefined },
  })),
}));

const mockSetTheme = vi.hoisted(() => vi.fn());
vi.mock('@/components/ui/theme-provider', () => ({
  useTheme: vi.fn(() => ({ theme: 'light', setTheme: mockSetTheme })),
}));

vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: vi.fn(),
}));

// ----- Import under test -----

import { Tabs } from '@/components/ui/tabs';
import { SettingsTabDisplay } from '../settings-tab-display';
import { DEFAULT_APPLICATION_SETTINGS, SettingsDisplayEnum } from '@/types/settings';
import { FolderHandleContext } from '@/context/folder-context';

// ----- Tests -----

describe('SettingsTabDisplay', () => {
  const renderWithTabs = () =>
    render(
      <Tabs defaultValue={SettingsDisplayEnum.Display}>
        <SettingsTabDisplay />
      </Tabs>,
    );

  it('renders without crashing', () => {
    const { container } = renderWithTabs();
    expect(container).not.toBeNull();
  });

  it('renders the Visual Theme label', () => {
    renderWithTabs();
    expect(screen.getByText('Visual Theme')).not.toBeNull();
  });

  it('renders the Visual Theme description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select light\/dark\/system themes/i)).not.toBeNull();
  });

  it('renders the Transitions/Animations label', () => {
    renderWithTabs();
    expect(screen.getByText('Transitions/Animations')).not.toBeNull();
  });

  it('renders the transitions description', () => {
    renderWithTabs();
    expect(screen.getByText(/Select or disable animations when traversing/i)).not.toBeNull();
  });

  it('renders the Application Layout label', () => {
    renderWithTabs();
    expect(screen.getByText('Application Layout')).not.toBeNull();
  });

  it('renders the application layout description', () => {
    renderWithTabs();
    expect(screen.getByText(/Set preferred widths for application/i)).not.toBeNull();
  });

  it('renders multiple Select triggers', () => {
    renderWithTabs();
    const triggers = screen.getAllByRole('combobox');
    expect(triggers.length).toBeGreaterThanOrEqual(3);
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
          <Tabs defaultValue={SettingsDisplayEnum.Display}>
            <SettingsTabDisplay />
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
      mockSetTheme.mockReset();
    });

    it('selecting Dark Theme calls setTheme with dark', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      const triggers = screen.getAllByRole('combobox');
      await user.click(triggers[0]);
      await user.click(screen.getByRole('option', { name: 'Dark Theme' }));
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('selecting Wide Layout calls setSettings with updated DisplaySize', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      const triggers = screen.getAllByRole('combobox');
      await user.click(triggers[2]);
      await user.click(screen.getByRole('option', { name: 'Wide Layout' }));
      expect(mockSetSettings).toHaveBeenCalledWith(
        expect.objectContaining({ DisplaySize: 'wide' }),
      );
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Dense Key Display calls setSettings with updated KeyDisplay', async () => {
      const user = userEvent.setup();
      renderWithProvider();
      const triggers = screen.getAllByRole('combobox');
      await user.click(triggers[3]);
      await user.click(screen.getByRole('option', { name: 'Dense Key Display' }));
      expect(mockSetSettings).toHaveBeenCalledWith(
        expect.objectContaining({ KeyDisplay: 'dense' }),
      );
      expect(mockSaveSettings).toHaveBeenCalled();
    });
  });
});
