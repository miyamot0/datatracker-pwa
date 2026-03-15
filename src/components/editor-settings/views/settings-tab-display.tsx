import { TabsContent } from '@/components/ui/tabs';
import { SettingsDisplayEnum } from '../types/settings-tab-enums';
import SettingsFormItemWrapper from './settings-form-item-wrapper';
import { SettingsTabContainer } from './settings-tab-container';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ApplicationSettingsTypes, KEY_DISPLAY_OPTIONS, KeyDisplayTypes, ScreenSizingOptions, ScreenSizingTypes, THEME_OPTIONS, ThemeTypes } from '@/types/settings';
import { FolderHandleContext } from '@/context/folder-context';
import { useTheme } from '@/components/ui/theme-provider';
import { useContext } from 'react';
import { displayConditionalNotification } from '@/lib/notifications';

export function SettingsTabDisplay() {
  const { settings, setSettings, saveSettings } = useContext(FolderHandleContext);
  const { setTheme, theme } = useTheme();

  return (
    <TabsContent value={SettingsDisplayEnum.Layout}>
      <SettingsTabContainer>
        <SettingsFormItemWrapper
          Label="Options for Theme/Displays"
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
          Label="Options for Key Displays"
          Description="Toggle standard or dense key layouts (i.e., many keys loaded)"
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
          Label="Options for Screen Displays"
          Description="Toggle standard or extra wide layouts (i.e., for larger monitors)"
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
      </SettingsTabContainer>
    </TabsContent>
  );
}
