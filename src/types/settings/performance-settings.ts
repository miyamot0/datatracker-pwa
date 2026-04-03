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
