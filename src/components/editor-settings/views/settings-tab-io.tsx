import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ApplicationSettingsTypes,
  CACHE_OPTIONS,
  CacheSettingTypes,
  POST_SESSION_BX_OPTIONS,
  PostSessionBxTypes,
  SESSION_RECORDER_POLLING_OPTIONS,
  SessionRecorderPolling,
  SettingsDisplayEnum,
} from '@/types/settings';
import { displayConditionalNotification } from '@/lib/notifications';
import SettingsFormItemWrapper from './settings-form-item-wrapper';
import { TabsContent } from '../../ui/tabs';
import { SettingsTabContainer } from './settings-tab-container';
import { FolderHandleContext } from '@/context/folder-context';
import { useContext } from 'react';

export function SettingsTabIO() {
  const { settings, setSettings, saveSettings } = useContext(FolderHandleContext);

  return (
    <TabsContent value={SettingsDisplayEnum.File}>
      <SettingsTabContainer>
        <SettingsFormItemWrapper
          Label="Records Caching"
          Description="Select how aggressively to cache records (i.e., may improve performance on slower devices or networks)"
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
          Label="Session Recorder Rendering"
          Description="Select the frequency of UI updates (Note: display performance, not recording performance)"
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

        <SettingsFormItemWrapper
          Label="Post-Session Program Behavior"
          Description="Select how you wish the program to behave after recording sessions (e.g., prepare for the next session)"
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
      </SettingsTabContainer>
    </TabsContent>
  );
}
