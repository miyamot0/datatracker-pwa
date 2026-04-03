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
