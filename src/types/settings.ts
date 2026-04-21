/**
 * @deprecated Use focused imports instead:
 * - @/types/settings/application-settings for ApplicationSettingsTypes, DEFAULT_APPLICATION_SETTINGS, SettingsDisplayEnum
 * - @/types/settings/display-settings for display/UI related settings
 * - @/types/settings/performance-settings for cache and polling settings
 * - @/types/settings/notification-settings for notification related settings
 * - @/types/settings/administrative-settings for admin settings
 */

// Main application settings (most commonly used)
export {
  ApplicationSettingsTypes,
  DEFAULT_APPLICATION_SETTINGS,
  SettingsDisplayEnum,
} from './settings/application-settings';

// Display settings
export {
  SessionDisplayOptions,
  SESSION_DISPLAY_OPTIONS,
  ApplicationFooterDisplay,
  APPLICATION_FOOTER_OPTIONS,
  KeyDisplayTypes,
  KEY_DISPLAY_OPTIONS,
  ScreenSizingTypes,
  ScreenSizingOptions,
  ThemeTypes,
  THEME_OPTIONS,
  TransitionSettingTypes,
  TRANSITION_SETTING_OPTIONS,
} from './settings/display-settings';

// Performance settings
export {
  CacheSettingTypes,
  CACHE_OPTIONS,
  SessionRecorderPolling,
  SESSION_RECORDER_POLLING_OPTIONS,
  SessionPollingIntervals,
} from './settings/performance-settings';

// Notification settings
export {
  NotificationSettingsTypes,
  NOTIFICATION_SETTINGS_OPTIONS,
  PostSessionBxTypes,
  POST_SESSION_BX_OPTIONS,
  ToolTipOptionTypes,
  TOOL_TIP_OPTIONS,
} from './settings/notification-settings';

// Administrative settings
export {
  ElevatedPrivilegesType,
  ELEVATED_PRIVILEGES_OPTIONS,
  EnforceDataFolderType,
  ENFORCED_NAMING_OPTIONS,
} from './settings/administrative-settings';
