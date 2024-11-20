import PageWrapper from '@/components/layout/page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderHandleContext } from '@/context/folder-context';
import { useContext } from 'react';
import SettingsFormItemWrapper from './views/settings-form-item-wrapper';
import {
  ApplicationSettingsTypes,
  ELEVATED_PRIVILEGES_OPTIONS,
  ElevatedPrivilegesType,
  ENFORCED_NAMING_OPTIONS,
  EnforceDataFolderType,
  NOTIFICATION_SETTINGS_OPTIONS,
  NotificationSettingsTypes,
  POST_SESSION_BX_OPTIONS,
  PostSessionBxTypes,
  THEME_OPTIONS,
  ThemeTypes,
  TOOL_TIP_OPTIONS,
  ToolTipOptionTypes,
} from '@/types/settings';
import { displayConditionalNotification } from '@/lib/notifications';
import { useTheme } from '@/components/ui/theme-provider';

export default function SettingsPage() {
  const { settings, setSettings, saveSettings } = useContext(FolderHandleContext);
  const { setTheme, theme } = useTheme();

  return (
    <PageWrapper label="Settings" className="select-none">
      <Card className="w-full">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Application Settings</CardTitle>
            <CardDescription>Manage and Update Settings for Data Tracker</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="min-h-96 flex flex-col justify-start gap-6">
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
            Label="Provide Elevated Privileges"
            Description="Override typical behavior and allow the deletion of data (Warning: Risk of permanent data loss)"
          >
            <Select
              value={settings.EnableFileDeletion ? 'true' : 'false'}
              onValueChange={(value: ElevatedPrivilegesType) => {
                const newSettings = {
                  ...settings,
                  EnableFileDeletion: value === 'true',
                } satisfies ApplicationSettingsTypes;
                setSettings(newSettings);
                saveSettings(newSettings);

                displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
              }}
            >
              <SelectTrigger className="w-full md:max-w-[250px]">
                <SelectValue placeholder="Select Privilege Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ELEVATED_PRIVILEGES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </SettingsFormItemWrapper>

          <SettingsFormItemWrapper
            Label="Enforce Strict Data Folder Names"
            Description="Override typical behavior to use folders named other than 'DataTracker'"
          >
            <Select
              value={settings.EnforceDataFolderName ? 'true' : 'false'}
              onValueChange={(value: EnforceDataFolderType) => {
                const newSettings = {
                  ...settings,
                  EnforceDataFolderName: value === 'true',
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
                  {ENFORCED_NAMING_OPTIONS.map((option) => (
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
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
