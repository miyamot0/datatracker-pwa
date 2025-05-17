/**
 * Types for theme options
 */
export type ThemeTypes = 'light' | 'dark' | 'system';

export const THEME_OPTIONS: { value: ThemeTypes; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/**
 * Types for after-session recording preferences
 */
export type PostSessionBxTypes = 'AwaitInput' | 'AutoAdvance';

export const POST_SESSION_BX_OPTIONS: {
  value: PostSessionBxTypes;
  label: string;
}[] = [
  { value: 'AwaitInput', label: 'Await Input' },
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
  { value: 'ShowAll', label: 'Show All' },
  { value: 'ShowErrorsOnly', label: 'Show Errors Only' },
  { value: 'ShowNone', label: 'Show None' },
];

/**
 * Types for data privileges
 */
export type ElevatedPrivilegesType = 'true' | 'false';

export const ELEVATED_PRIVILEGES_OPTIONS: {
  value: ElevatedPrivilegesType;
  label: string;
}[] = [
  { value: 'true', label: 'Allow Deletion' },
  { value: 'false', label: 'Disable Deletion' },
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
 * Type for application settings
 */
export type ApplicationSettingsTypes = {
  PostSessionBx: PostSessionBxTypes;
  NotificationSettings: NotificationSettingsTypes;
  EnableFileDeletion: boolean;
  EnforceDataFolderName: boolean;
  EnableToolTip: boolean;
  IsReturningUser: boolean;
};

export const DEFAULT_APPLICATION_SETTINGS: ApplicationSettingsTypes = {
  PostSessionBx: 'AwaitInput',
  NotificationSettings: 'ShowAll',
  EnableFileDeletion: false,
  EnforceDataFolderName: true,
  EnableToolTip: true,
  IsReturningUser: true,
};
