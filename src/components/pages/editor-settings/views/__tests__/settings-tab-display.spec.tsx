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

const mockRouter = vi.hoisted(() => ({ options: { defaultViewTransition: undefined as unknown } }));
vi.mock('@tanstack/react-router', () => ({
  useRouter: vi.fn(() => mockRouter),
}));

const mockSetTheme = vi.hoisted(() => vi.fn());
const mockThemeState = vi.hoisted(() => ({ value: 'light' as 'light' | 'dark' | 'system' | undefined }));
vi.mock('@/components/ui/theme-provider', () => ({
  useTheme: vi.fn(() => ({ theme: mockThemeState.value, setTheme: mockSetTheme })),
}));

const mockDisplayConditionalNotification = vi.hoisted(() => vi.fn());
vi.mock('@/lib/notifications', () => ({
  displayConditionalNotification: mockDisplayConditionalNotification,
}));

const mockViewTransitionCall = vi.hoisted(() => vi.fn(() => 'mock-transition'));
vi.mock('@/types/transitions', () => ({
  viewTransitionCall: mockViewTransitionCall,
}));

// ----- Import under test -----

import { Tabs } from '@/components/ui/tabs';
import { SettingsTabDisplay } from '../settings-tab-display';
import { DEFAULT_APPLICATION_SETTINGS, SettingsDisplayEnum } from '@/types/settings/application-settings';
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
      mockDisplayConditionalNotification.mockReset();
      mockViewTransitionCall.mockReset();
      mockViewTransitionCall.mockReturnValue('mock-transition');
      mockRouter.options.defaultViewTransition = undefined;
      mockThemeState.value = 'light';
    });

    it('selecting Dark Theme calls setTheme with dark', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[0].click();
      await page.getByRole('option', { name: 'Dark Theme' }).click();
      expect(mockSetTheme).toHaveBeenCalledWith('dark');
      expect(mockDisplayConditionalNotification).toHaveBeenCalled();
    });

    it('falls back to system when theme is undefined', async () => {
      mockThemeState.value = undefined;
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
    });

    it('selecting slide transition updates settings and router transition callback', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[1].click();
      await page.getByRole('option', { name: 'Slide Transitions' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ TransitionBehavior: 'slide' }));
      expect(mockSaveSettings).toHaveBeenCalled();
      expect(mockViewTransitionCall).toHaveBeenCalledWith('slide');
      expect(mockRouter.options.defaultViewTransition).toBe('mock-transition');
      expect(mockDisplayConditionalNotification).toHaveBeenCalled();
    });

    it('selecting Wide Layout calls setSettings with updated DisplaySize', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[2].click();
      await page.getByRole('option', { name: /^Wide Layout$/ }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ DisplaySize: 'wide' }));
      expect(mockSaveSettings).toHaveBeenCalled();
      expect(mockDisplayConditionalNotification).toHaveBeenCalled();
    });

    it('selecting Dense Key Display calls setSettings with updated KeyDisplay', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[3].click();
      await page.getByRole('option', { name: 'Dense Key Display' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ KeyDisplay: 'dense' }));
      expect(mockSaveSettings).toHaveBeenCalled();
      expect(mockDisplayConditionalNotification).toHaveBeenCalled();
    });

    it('selecting full screen updates session display setting', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[4].click();
      await page.getByRole('option', { name: 'Full Screen Display' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ SessionDisplay: 'FullScreen' }));
      expect(mockSaveSettings).toHaveBeenCalled();
      expect(mockDisplayConditionalNotification).toHaveBeenCalled();
    });

    it('selecting disabled footer updates footer display setting', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[5].click();
      await page.getByRole('option', { name: 'Disable Footer Entirely' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ ApplicationFooterDisplay: 'Disabled' }));
      expect(mockSaveSettings).toHaveBeenCalled();
      expect(mockDisplayConditionalNotification).toHaveBeenCalled();
    });

    it('selecting hide timer two updates TimerTwoDisplay', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[6].click();
      await page.getByRole('option', { name: 'Hide Timer Two' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ TimerTwoDisplay: 'hide' }));
      expect(mockSaveSettings).toHaveBeenCalled();
      expect(mockDisplayConditionalNotification).toHaveBeenCalled();
    });

    it('selecting show timer three updates TimerThreeDisplay', async () => {
      await renderWithProvider();
      await expect.element(page.getByRole('combobox').first()).toBeInTheDocument();
      const triggers = await page.getByRole('combobox').all();
      await triggers[7].click();
      await page.getByRole('option', { name: 'Show Timer Three' }).click();
      expect(mockSetSettings).toHaveBeenCalledWith(expect.objectContaining({ TimerThreeDisplay: 'show' }));
      expect(mockSaveSettings).toHaveBeenCalled();
      expect(mockDisplayConditionalNotification).toHaveBeenCalled();
    });
  });
});
