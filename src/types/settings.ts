/**
 * Types for session display options
 */
export type SessionDisplayOptions = 'Standard' | 'FullScreen';

/**
 * Options for session display
 */
export const SESSION_DISPLAY_OPTIONS: {
  value: SessionDisplayOptions;
  label: string;
}[] = [
  { value: 'Standard', label: 'Standard Display' },
  { value: 'FullScreen', label: 'Full Screen Display' },
];

/**
 * Types for application footer display options
 */
export type ApplicationFooterDisplay = 'Standard' | 'NonSession' | 'Disabled';

/**
 * Options for application footer display
 */
export const APPLICATION_FOOTER_OPTIONS: {
  value: ApplicationFooterDisplay;
  label: string;
}[] = [
  { value: 'Standard', label: 'Show Footer' },
  { value: 'NonSession', label: 'Hide Footer during Recording' },
  { value: 'Disabled', label: 'Disable Footer Entirely' },
];

/**
 * Types for session recorder polling intervals
 */
export type SessionRecorderPolling = 'course' | 'normal' | 'precise' | 'extreme';

/**
 * This constant defines the available options for session recorder polling intervals in the application. Each option consists of a `value`, which is one of the allowed `SessionRecorderPolling` values, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select their preferred polling interval for the session recorder.
 */
export const SESSION_RECORDER_POLLING_OPTIONS: {
  value: SessionRecorderPolling;
  label: string;
}[] = [
  { value: 'course', label: 'Course (100ms)' },
  { value: 'normal', label: 'Normal (50ms)' },
  { value: 'precise', label: 'Precise (25ms)' },
  { value: 'extreme', label: 'Extreme (10ms)' },
];

/**
 * Values for specific polling intervals in UI
 */
export const SessionPollingIntervals: Record<SessionRecorderPolling, number> = {
  course: 100,
  normal: 50,
  precise: 25,
  extreme: 10,
};

/**
 * Types for cache settings
 */
export type CacheSettingTypes = 'normal' | 'aggressive';

/**
 * This constant defines the available options for cache settings in the application. Each option consists of a `value`, which is one of the allowed `CacheSettingTypes` values, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select their preferred caching behavior. This structure facilitates both type safety and user-friendly interaction when configuring cache settings in the application.
 */
export const CACHE_OPTIONS: { value: CacheSettingTypes; label: string }[] = [
  { value: 'normal', label: 'Normal Caching' },
  { value: 'aggressive', label: 'Aggressive Caching' },
];

/**
 * Types for theme options
 */
export type ThemeTypes = 'light' | 'dark' | 'system';

/**
 * This constant defines the available options for theme settings in the application. Each option consists of a `value`, which is one of the allowed `ThemeTypes` values, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select their preferred theme. This structure facilitates both type safety and user-friendly interaction when configuring theme settings in the application.
 */
export const THEME_OPTIONS: { value: ThemeTypes; label: string }[] = [
  { value: 'light', label: 'Light Theme' },
  { value: 'dark', label: 'Dark Theme' },
  { value: 'system', label: 'Use System Theme' },
];

/**
 * Types for key display options
 */
export type KeyDisplayTypes = 'standard' | 'dense';

/**
 * This constant defines the available options for key display settings in the application. Each option consists of a `value`, which is one of the allowed `KeyDisplayTypes` values, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select their preferred key display style. This structure facilitates both type safety and user-friendly interaction when configuring key display settings in the application.
 */
export const KEY_DISPLAY_OPTIONS: { value: KeyDisplayTypes; label: string }[] = [
  { value: 'standard', label: 'Standard Key Display' },
  { value: 'dense', label: 'Dense Key Display' },
];

/**
 * Types for screen size options
 */

export type ScreenSizingTypes = 'standard' | 'wide' | 'extra-wide';

/**
 * This constant defines the available options for screen sizing settings in the application. Each option consists of a `value`, which is one of the allowed `ScreenSizingTypes` values, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select their preferred screen layout. This structure facilitates both type safety and user-friendly interaction when configuring screen sizing settings in the application.
 */
export const ScreenSizingOptions: { value: ScreenSizingTypes; label: string }[] = [
  { value: 'standard', label: 'Standard Layout' },
  { value: 'wide', label: 'Wide Layout' },
  { value: 'extra-wide', label: 'Extra Wide Layout' },
];

/**
 * Types for after-session recording preferences
 */
export type PostSessionBxTypes = 'AwaitInput' | 'AutoAdvance';

/**
 * This constant defines the available options for post-session behavior settings in the application. Each option consists of a `value`, which is one of the allowed `PostSessionBxTypes` values, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select their preferred behavior after recording a session. This structure facilitates both type safety and user-friendly interaction when configuring post-session behavior settings in the application.
 */
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

/**
 * This constant defines the available options for notification settings in the application. Each option consists of a `value`, which is one of the allowed `NotificationSettingsTypes` values, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select their preferred level of notifications. This structure facilitates both type safety and user-friendly interaction when configuring notification settings in the application.
 */
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

/**
 * This constant defines the available options for elevated privileges settings in the application. Each option consists of a `value`, which is one of the allowed `ElevatedPrivilegesType` values, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select whether to allow or disable elevated privileges. This structure facilitates both type safety and user-friendly interaction when configuring elevated privileges settings in the application.
 */
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

/**
 * This constant defines the available options for enforcing data folder naming conventions in the application. Each option consists of a `value`, which is one of the allowed `EnforceDataFolderType` values, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select whether to require a specific folder name (e.g., 'DataTracker') or to disable this requirement. This structure facilitates both type safety and user-friendly interaction when configuring folder naming settings in the application.
 */
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

/**
 * This constant defines the available options for tooltip display settings in the application. Each option consists of a `value`, which is one of the allowed `ToolTipOptionTypes` values, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select whether to show all tooltips or to disable them entirely. This structure facilitates both type safety and user-friendly interaction when configuring tooltip display settings in the application.
 */
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

/**
 * This constant defines the available options for transition settings in the application. Each option consists of a `value`, which is one of the allowed `TransitionSettingTypes` values, and a `label`, which is a human-readable string that can be displayed in the user interface (e.g., in a dropdown menu) to allow users to select their preferred transition style for view changes within the application. This structure facilitates both type safety and user-friendly interaction when configuring transition settings in the application.
 */
export const TRANSITION_SETTING_OPTIONS: {
  value: TransitionSettingTypes;
  label: string;
}[] = [
  { value: 'none', label: 'Disable Transitions' },
  { value: 'slide', label: 'Slide Transitions' },
  { value: 'fade', label: 'Fade Transitions' },
];

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
  TimerThreeDisplay: 'show',
};
