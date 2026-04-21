import {
  SessionDisplayOptions,
  ApplicationFooterDisplay,
  KeyDisplayTypes,
  ScreenSizingTypes,
  TransitionSettingTypes,
} from './display-settings';
import { CacheSettingTypes, SessionRecorderPolling } from './performance-settings';
import { NotificationSettingsTypes, PostSessionBxTypes } from './notification-settings';

/**
 * Enum for settings display categories in the application.
 */
export enum SettingsDisplayEnum {
  Display = 'Theme and Layout',
  Notifications = 'Notifications',
  File = 'Performance',
  Admin = 'Administrative',
}

/**
 * Type for application settings
 */
export type ApplicationSettingsTypes = {
  PostSessionBx: PostSessionBxTypes;
  NotificationSettings: NotificationSettingsTypes;
  EnableFileDeletion: boolean;
  EnforceDataFolderName: boolean;
  EnableToolTip: boolean;
  IsReturningUser: boolean;
  KeyDisplay: KeyDisplayTypes;
  DisplaySize: ScreenSizingTypes;
  CacheBehavior: CacheSettingTypes;
  TransitionBehavior: TransitionSettingTypes;
  RecorderPolling: SessionRecorderPolling;
  ApplicationFooterDisplay: ApplicationFooterDisplay;
  SessionDisplay: SessionDisplayOptions;
  TimerTwoDisplay: 'hide' | 'show';
  TimerThreeDisplay: 'hide' | 'show';
};

/**
 * Default application settings
 */
export const DEFAULT_APPLICATION_SETTINGS: ApplicationSettingsTypes = {
  PostSessionBx: 'AwaitInput',
  NotificationSettings: 'ShowAll',
  EnableFileDeletion: false,
  EnforceDataFolderName: true,
  EnableToolTip: true,
  IsReturningUser: true,
  KeyDisplay: 'standard',
  DisplaySize: 'standard',
  CacheBehavior: 'normal',
  TransitionBehavior: 'fade',
  RecorderPolling: 'normal',
  ApplicationFooterDisplay: 'Standard',
  SessionDisplay: 'Standard',
  TimerTwoDisplay: 'show',
  TimerThreeDisplay: 'hide',
};
