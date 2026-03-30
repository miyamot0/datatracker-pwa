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

  it('renders without crashing', async () => {
    const { container } = await renderWithTabs();
    expect(container).not.toBeNull();
  });

  it('renders the Visual Theme label', async () => {
    await renderWithTabs();
    await expect.element(page.getByText('Visual Theme')).toBeInTheDocument();
  });

  it('renders the Visual Theme description', async () => {
    await renderWithTabs();
    await expect.element(page.getByText(/Select light\/dark\/system themes/i)).toBeInTheDocument();
  });

  it('renders the Transitions/Animations label', async () => {
    await renderWithTabs();
    await expect.element(page.getByText('Transitions/Animations')).toBeInTheDocument();
  });

  it('renders the transitions description', async () => {
    await renderWithTabs();
    await expect.element(page.getByText(/Select or disable animations when traversing/i)).toBeInTheDocument();
  });

  it('renders the Application Layout label', async () => {
    await renderWithTabs();
    await expect.element(page.getByText('Application Layout')).toBeInTheDocument();
  });

  it('renders the application layout description', async () => {
    await renderWithTabs();
    await expect.element(page.getByText(/Set preferred widths for application/i)).toBeInTheDocument();
  });

  it('renders multiple Select triggers', async () => {
    await renderWithTabs();
    await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
    const triggers = await page.getByRole('combobox').all();
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

    beforeEach(() => {
      mockSetSettings.mockReset();
      mockSaveSettings.mockReset();
      mockSetTheme.mockReset();
    });

    it('selecting Dark Theme calls setTheme with dark', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[0].click();
      await page.getByRole('option', { name: 'Dark Theme' }).click();
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
    });

    it('selecting Wide Layout calls setSettings with updated DisplaySize', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[2].click();
      await page.getByRole('option', { name: /^Wide Layout$/ }).click();
      expect(mockSetSettings).toHaveBeenCalled();
      expect(mockSaveSettings).toHaveBeenCalled();
    });

    it('selecting Dense Key Display calls setSettings with updated KeyDisplay', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[3].click();
      await page.getByRole('option', { name: 'Dense Key Display' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ KeyDisplay: 'dense' }));
      expect(mockSaveSettings).toHaveBeenCalled();
    });
  });
});

