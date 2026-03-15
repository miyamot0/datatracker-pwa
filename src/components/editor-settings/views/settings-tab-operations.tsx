import { TabsContent } from '@/components/ui/tabs';
import { SettingsTabContainer } from './settings-tab-container';
import SettingsFormItemWrapper from './settings-form-item-wrapper';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ApplicationSettingsTypes,
  NOTIFICATION_SETTINGS_OPTIONS,
  NotificationSettingsTypes,
  POST_SESSION_BX_OPTIONS,
  PostSessionBxTypes,
  TOOL_TIP_OPTIONS,
  ToolTipOptionTypes,
} from '@/types/settings';
import { displayConditionalNotification } from '@/lib/notifications';
import { useContext } from 'react';
import { FolderHandleContext } from '@/context/folder-context';
import { SettingsDisplayEnum } from '../types/settings-tab-enums';

export function SettingsTabOperations() {
  const { settings, setSettings, saveSettings } = useContext(FolderHandleContext);

  return (
    <TabsContent value={SettingsDisplayEnum.Operation}>
      <SettingsTabContainer>
        <SettingsFormItemWrapper
          Label="After-Session Program Behavior"
          Description="Set preferences for how the program should respond after each session"
        >
          <Select
            value={settings.PostSessionBx}
            onValueChange={(value: PostSessionBxTypes) => {
              const newSettings = {
                ...settings,
                PostSessionBx: value,
              } satisfies ApplicationSettingsTypes;
              setSettings(newSettings);
              saveSettings(newSettings);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue placeholder="Select Advancement Option" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {POST_SESSION_BX_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>

        <SettingsFormItemWrapper
          Label="Level of Alert Notification"
          Description="Set whether the program should provide frequent notifications"
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
          Label="Level of Tooltip Notification"
          Description="Set whether the program should provide enhanced tooltip guidance (i.e., messages on hover)"
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
              <SelectValue placeholder="Select Notification Level" />
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
