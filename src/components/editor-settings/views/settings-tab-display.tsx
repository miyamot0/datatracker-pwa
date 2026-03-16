import { TabsContent } from '@/components/ui/tabs';
import { SettingsDisplayEnum } from '../types/settings-tab-enums';
import SettingsFormItemWrapper from './settings-form-item-wrapper';
import { SettingsTabContainer } from './settings-tab-container';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  APPLICATION_FOOTER_OPTIONS,
  ApplicationFooterDisplay,
  ApplicationSettingsTypes,
  KEY_DISPLAY_OPTIONS,
  KeyDisplayTypes,
  NOTIFICATION_SETTINGS_OPTIONS,
  NotificationSettingsTypes,
  ScreenSizingOptions,
  ScreenSizingTypes,
  THEME_OPTIONS,
  ThemeTypes,
  TOOL_TIP_OPTIONS,
  ToolTipOptionTypes,
} from '@/types/settings';
import { FolderHandleContext } from '@/context/folder-context';
import { useTheme } from '@/components/ui/theme-provider';
import { useContext } from 'react';
import { displayConditionalNotification } from '@/lib/notifications';
import { TRANSITION_OPTIONS, TransitionOptions, viewTransitionCall } from '@/types/transitions';
import { useRouter } from '@tanstack/react-router';

export function SettingsTabDisplay() {
  const { settings, setSettings, saveSettings } = useContext(FolderHandleContext);
  const router = useRouter();
  const { setTheme, theme } = useTheme();

  return (
    <TabsContent value={SettingsDisplayEnum.Layout}>
      <SettingsTabContainer>
        <SettingsFormItemWrapper
          Label="Application Theme"
          Description="Toggle light/dark/system themes based on preference (e.g., dark mode)"
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
          Label="Presentation of KeySet Options"
          Description="Toggle standard or dense key layouts (i.e., display more keys on screen)"
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
          Label="Application Layout Size"
          Description="Toggle standard or extra wide layouts for larger displays"
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
          Label="Page Transition Animations"
          Description="Select animations when transitioning between different pages"
        >
          <Select
            value={settings.TransitionBehavior}
            onValueChange={(value: TransitionOptions) => {
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
                {TRANSITION_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>

        <SettingsFormItemWrapper Label="Notification Levels" Description="Set whether the types notifications desired">
          <Select
            value={settings.NotificationSettings}
            onValueChange={(value: NotificationSettingsTypes) => {
              const newSettings = {
                ...settings,
                NotificationSettings: value,
              } satisfies ApplicationSettingsTypes;
              setSettings(newSettings);
              saveSettings(newSettings);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue placeholder="Select Notification Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {NOTIFICATION_SETTINGS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>

        <SettingsFormItemWrapper
          Label="Tooltip Levels"
          Description="Set whether app should provide tooltip guidance (Note: useful for new users)"
        >
          <Select
            value={settings.EnableToolTip === true ? 'All' : 'None'}
            onValueChange={(value: ToolTipOptionTypes) => {
              const newSettings = {
                ...settings,
                EnableToolTip: value === 'All',
              } satisfies ApplicationSettingsTypes;
              setSettings(newSettings);
              saveSettings(newSettings);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue placeholder="Select Tooltip Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {TOOL_TIP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>

        <SettingsFormItemWrapper
          Label="Application Footer Display"
          Description="Set the display style for the application footer."
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
      </SettingsTabContainer>
    </TabsContent>
  );
}
