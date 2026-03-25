import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ApplicationSettingsTypes,
  ELEVATED_PRIVILEGES_OPTIONS,
  ElevatedPrivilegesType,
  ENFORCED_NAMING_OPTIONS,
  EnforceDataFolderType,
  SettingsDisplayEnum,
} from '@/types/settings';
import { displayConditionalNotification } from '@/lib/notifications';
import SettingsFormItemWrapper from './settings-form-item-wrapper';
import { TabsContent } from '../../../ui/tabs';
import { SettingsTabContainer } from './settings-tab-container';
import { FolderHandleContext } from '@/context/folder-context';
import { useContext, useState } from 'react';
import { AnalyticsConsent, getConsent, setConsent } from '@/analytics/analytics-consent';

export function SettingsTabAdministrative() {
  const { settings, setSettings, saveSettings } = useContext(FolderHandleContext);
  const [consentState, setConsentState] = useState(getConsent());

  return (
    <TabsContent value={SettingsDisplayEnum.Admin}>
      <SettingsTabContainer>
        <SettingsFormItemWrapper
          Label="Allow Elevated Privileges"
          Description="Display options for copying/deleting/renaming records (Warning: Risks of permanent data loss)"
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
          Label="Enforce 'DataTracker' Folder Name"
          Description="Select whether to allow folders named other than 'DataTracker' (Not Recommended)"
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
          Label="Contribute Anonymous Error Logging"
          Description="Select whether to allow anonymous error logging"
        >
          <Select
            value={consentState}
            onValueChange={(value: AnalyticsConsent) => {
              setConsentState(value);
              setConsent(value);

              displayConditionalNotification(settings, 'Settings updated.', 'Settings have been saved.');
            }}
          >
            <SelectTrigger className="w-full md:max-w-[250px]">
              <SelectValue placeholder="Set Anonymous Error Logging" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={'granted'}>Allow anonymous error logs</SelectItem>
                <SelectItem value={'denied'}>Deny anonymous error logs</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </SettingsFormItemWrapper>
      </SettingsTabContainer>
    </TabsContent>
  );
}
