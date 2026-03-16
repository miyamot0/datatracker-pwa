import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ApplicationSettingsTypes,
  CACHE_OPTIONS,
  CacheSettingTypes,
  ELEVATED_PRIVILEGES_OPTIONS,
  ElevatedPrivilegesType,
  ENFORCED_NAMING_OPTIONS,
  EnforceDataFolderType,
  POST_SESSION_BX_OPTIONS,
  PostSessionBxTypes,
  SESSION_RECORDER_POLLING_OPTIONS,
  SessionRecorderPolling,
} from '@/types/settings';
import { displayConditionalNotification } from '@/lib/notifications';
import SettingsFormItemWrapper from '../views/settings-form-item-wrapper';
import { TabsContent } from '../../ui/tabs';
import { SettingsTabContainer } from '../views/settings-tab-container';
import { SettingsDisplayEnum } from '../types/settings-tab-enums';
import { FolderHandleContext } from '@/context/folder-context';
import { useContext } from 'react';

export function SettingsTabAdvanced() {
  const { settings, setSettings, saveSettings } = useContext(FolderHandleContext);

  return (
    <TabsContent value={SettingsDisplayEnum.Advanced}>
      <SettingsTabContainer>
        <SettingsFormItemWrapper
          Label="Caching Behavior"
          Description="Aggressive caching minimizes file calls (i.e., helps with slower devices/networks)"
        >
          <Select
            value={settings.CacheBehavior}
            onValueChange={(value: CacheSettingTypes) => {
              const newSettings = {
                ...settings,
                CacheBehavior: value,
              } satisfies ApplicationSettingsTypes;

              setSettings(newSettings);
              saveSettings(newSettings);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue placeholder="Select Cache Behavior" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {CACHE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>

        <SettingsFormItemWrapper
          Label="After-Session Behavior"
          Description="Set preferences for how the program should respond after completing a session"
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
          Description="Override typical behavior and allow the copying/deleting/renaming of data (Warning: Risk of permanent data loss)"
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
              <SelectValue placeholder="Select Data Folder Naming" />
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
          Label="Session UI Rendering"
          Description="Set the polling interval for the session recorder's UI updates (Note: recording fidelity is consistent regardless)"
        >
          <Select
            value={settings.RecorderPolling}
            onValueChange={(value: SessionRecorderPolling) => {
              const newSettings = {
                ...settings,
                RecorderPolling: value,
              } satisfies ApplicationSettingsTypes;
              setSettings(newSettings);
              saveSettings(newSettings);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue placeholder="Select Session Timing Precision" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {SESSION_RECORDER_POLLING_OPTIONS.map((option) => (
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
