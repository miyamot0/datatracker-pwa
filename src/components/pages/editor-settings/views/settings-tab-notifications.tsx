import { TabsContent } from '@/components/ui/tabs';
import SettingsFormItemWrapper from './settings-form-item-wrapper';
import { SettingsTabContainer } from './settings-tab-container';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ApplicationSettingsTypes,
  NOTIFICATION_SETTINGS_OPTIONS,
  NotificationSettingsTypes,
  TOOL_TIP_OPTIONS,
  ToolTipOptionTypes,
  SettingsDisplayEnum,
} from '@/types/settings';
import { FolderHandleContext } from '@/context/folder-context';
import { useContext } from 'react';
import { displayConditionalNotification } from '@/lib/notifications';

export function SettingsTabNotifications() {
  const { settings, setSettings, saveSettings } = useContext(FolderHandleContext);

  return (
    <TabsContent value={SettingsDisplayEnum.Notifications}>
      <SettingsTabContainer>
        <SettingsFormItemWrapper
          Label="Notification Level"
          Description="Select the range and types of notifications provided"
        >
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
          Label="Visual Tooltip Level"
          Description="Select the range and level of visual tooltips provided (i.e., hover over elements for information)"
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
      </SettingsTabContainer>
    </TabsContent>
  );
}
