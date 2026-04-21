import { TabsContent } from '@/components/ui/tabs';
import SettingsFormItemWrapper from './settings-form-item-wrapper';
import { SettingsTabContainer } from './settings-tab-container';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApplicationSettingsTypes, SettingsDisplayEnum } from '@/types/settings/application-settings';
import {
  APPLICATION_FOOTER_OPTIONS,
  ApplicationFooterDisplay,
  KEY_DISPLAY_OPTIONS,
  KeyDisplayTypes,
  ScreenSizingOptions,
  ScreenSizingTypes,
  SESSION_DISPLAY_OPTIONS,
  SessionDisplayOptions,
  THEME_OPTIONS,
  ThemeTypes,
  TransitionSettingTypes,
  TRANSITION_SETTING_OPTIONS,
} from '@/types/settings/display-settings';
import { FolderHandleContext } from '@/context/folder-context';
import { useTheme } from '@/components/ui/theme-provider';
import { useContext } from 'react';
import { displayConditionalNotification } from '@/lib/notifications';
import { viewTransitionCall } from '@/types/transitions';
import { useRouter } from '@tanstack/react-router';

export function SettingsTabDisplay() {
  const { settings, setSettings, saveSettings } = useContext(FolderHandleContext);
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  return (
    <TabsContent value={SettingsDisplayEnum.Display}>
      <SettingsTabContainer>
        <SettingsFormItemWrapper
          Label="Visual Theme"
          Description="Select light/dark/system themes (e.g., dark mode for low light environments)"
        >
          <Select
            value={theme ?? 'system'}
            onValueChange={(value: ThemeTypes) => {
              setTheme(value);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>
        <SettingsFormItemWrapper
          Label="Transitions/Animations"
          Description="Select or disable animations when traversing the application"
        >
          <Select
            value={settings.TransitionBehavior}
            onValueChange={(value: TransitionSettingTypes) => {
              const newSettings = {
                ...settings,
                TransitionBehavior: value,
              } satisfies ApplicationSettingsTypes;

              setSettings(newSettings);
              saveSettings(newSettings);

              router.options.defaultViewTransition = viewTransitionCall(newSettings.TransitionBehavior);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {TRANSITION_SETTING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>
        <SettingsFormItemWrapper
          Label="Application Layout"
          Description="Set preferred widths for application (e.g., compact layout for smaller screens)"
        >
          <Select
            value={settings.DisplaySize}
            onValueChange={(value: ScreenSizingTypes) => {
              const newSettings = {
                ...settings,
                DisplaySize: value,
              } satisfies ApplicationSettingsTypes;

              setSettings(newSettings);
              saveSettings(newSettings);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ScreenSizingOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>
        <SettingsFormItemWrapper
          Label="Density of KeySet"
          Description="Select whether to display more or fewer keys in the display"
        >
          <Select
            value={settings.KeyDisplay}
            onValueChange={(value: KeyDisplayTypes) => {
              const newSettings = {
                ...settings,
                KeyDisplay: value,
              } satisfies ApplicationSettingsTypes;

              setSettings(newSettings);
              saveSettings(newSettings);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {KEY_DISPLAY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>
        <SettingsFormItemWrapper
          Label="Fullscreen Session Recording"
          Description="Set whether session recording should take advantage of the full screen"
        >
          <Select
            value={settings.SessionDisplay}
            onValueChange={(value: SessionDisplayOptions) => {
              const newSettings = {
                ...settings,
                SessionDisplay: value,
              } satisfies ApplicationSettingsTypes;
              setSettings(newSettings);
              saveSettings(newSettings);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue placeholder="Select Session Display" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {SESSION_DISPLAY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>
        <SettingsFormItemWrapper
          Label="Footer Display"
          Description="Enable or conditionally disable footer in the application"
        >
          <Select
            value={settings.ApplicationFooterDisplay}
            onValueChange={(value: ApplicationFooterDisplay) => {
              const newSettings = {
                ...settings,
                ApplicationFooterDisplay: value,
              } satisfies ApplicationSettingsTypes;
              setSettings(newSettings);
              saveSettings(newSettings);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue placeholder="Select Footer Display" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {APPLICATION_FOOTER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>

        <SettingsFormItemWrapper
          Label="Disable Timer #2"
          Description="Disable Timer #2 functionality and hide from displays (e.g., if only using one timer)"
        >
          <Select
            value={settings.TimerTwoDisplay}
            onValueChange={(value: 'hide' | 'show') => {
              const newSettings = {
                ...settings,
                TimerTwoDisplay: value,
              } satisfies ApplicationSettingsTypes;
              setSettings(newSettings);
              saveSettings(newSettings);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue placeholder="Select Timer Two Display" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {['hide', 'show'].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === 'hide' ? 'Hide Timer Two' : 'Show Timer Two'}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>

        <SettingsFormItemWrapper
          Label="Disable Timer #3"
          Description="Disable Timer #3 functionality and hide from displays (e.g., if only using one timer)"
        >
          <Select
            value={settings.TimerThreeDisplay}
            onValueChange={(value: 'hide' | 'show') => {
              const newSettings = {
                ...settings,
                TimerThreeDisplay: value,
              } satisfies ApplicationSettingsTypes;
              setSettings(newSettings);
              saveSettings(newSettings);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue placeholder="Select Timer Three Display" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {['hide', 'show'].map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === 'hide' ? 'Hide Timer Three' : 'Show Timer Three'}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>
      </SettingsTabContainer>
    </TabsContent>
  );
}
