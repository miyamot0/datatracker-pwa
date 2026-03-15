/**
 * Types for cache settings
 */
export type CacheSettingTypes = 'normal' | 'aggressive';

export const CACHE_OPTIONS: { value: CacheSettingTypes; label: string }[] = [
  { value: 'normal', label: 'Normal Caching' },
  { value: 'aggressive', label: 'Aggressive Caching' },
];

/**
 * Types for theme options
 */
export type ThemeTypes = 'light' | 'dark' | 'system';

export const THEME_OPTIONS: { value: ThemeTypes; label: string }[] = [
  { value: 'light', label: 'Light Theme' },
  { value: 'dark', label: 'Dark Theme' },
  { value: 'system', label: 'Use System Theme' },
];

/**
 * Types for key display options
 */
export type KeyDisplayTypes = 'standard' | 'dense';

export const KEY_DISPLAY_OPTIONS: { value: KeyDisplayTypes; label: string }[] = [
  { value: 'standard', label: 'Standard Key Display' },
  { value: 'dense', label: 'Dense Key Display' },
];

/**
 * Types for screen size options
 */

export type ScreenSizingTypes = 'standard' | 'wide' | 'extra-wide';

export const ScreenSizingOptions: { value: ScreenSizingTypes; label: string }[] = [
  { value: 'standard', label: 'Standard Layout' },
  { value: 'wide', label: 'Wide Layout' },
  { value: 'extra-wide', label: 'Extra Wide Layout' },
];

/**
 * Types for after-session recording preferences
 */
export type PostSessionBxTypes = 'AwaitInput' | 'AutoAdvance';

export const POST_SESSION_BX_OPTIONS: {
  value: PostSessionBxTypes;
  label: string;
}[] = [
  { value: 'AwaitInput', label: 'Await User Input' },
  { value: 'AutoAdvance', label: 'Auto Advance' },
];

/**
 * Types for notification settings
 */
export type NotificationSettingsTypes = 'ShowAll' | 'ShowErrorsOnly' | 'ShowNone';

export const NOTIFICATION_SETTINGS_OPTIONS: {
  value: NotificationSettingsTypes;
  label: string;
}[] = [
  { value: 'ShowAll', label: 'Show All Notifications' },
  { value: 'ShowErrorsOnly', label: 'Show Errors Only' },
  { value: 'ShowNone', label: 'Show No Notifications' },
];

/**
 * Types for data privileges
 */
export type ElevatedPrivilegesType = 'true' | 'false';

export const ELEVATED_PRIVILEGES_OPTIONS: {
  value: ElevatedPrivilegesType;
  label: string;
}[] = [
  { value: 'true', label: 'Allow' },
  { value: 'false', label: 'Disable' },
];

/**
 * Types for folder naming permissions
 */
export type EnforceDataFolderType = 'true' | 'false';

export const ENFORCED_NAMING_OPTIONS: {
  value: EnforceDataFolderType;
  label: string;
}[] = [
  { value: 'true', label: "'DataTracker' Name Required" },
  { value: 'false', label: 'Disable Requirements' },
];

/**
 * Types for tooltip displays
 */
export type ToolTipOptionTypes = 'All' | 'None';

export const TOOL_TIP_OPTIONS: {
  value: ToolTipOptionTypes;
  label: string;
}[] = [
  { value: 'All', label: 'Show All Tooltips' },
  { value: 'None', label: 'Disable Tooltips' },
];

/**
 * Types for transition settings
 */

export type TransitionSettingTypes = 'none' | 'slide' | 'fade';

export const TRANSITION_SETTING_OPTIONS: {
  value: TransitionSettingTypes;
  label: string;
}[] = [
  { value: 'none', label: 'Disable Transitions' },
  { value: 'slide', label: 'Slide Transitions' },
  { value: 'fade', label: 'Fade Transitions' },
];

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
};

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
};
