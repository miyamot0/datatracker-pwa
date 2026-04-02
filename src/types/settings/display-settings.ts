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
