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
