/**
 * @deprecated This barrel export is deprecated. Import directly from focused files:
 * - Session settings: @/lib/dtos/session-settings
 * - Session results: @/lib/dtos/session-results
 */

// Re-exports from focused files for backward compatibility
export type { SavedSettings } from './dtos/session-settings';

export { DEFAULT_SESSION_SETTINGS, toSavedSettings } from './dtos/session-settings';

export type { SavedSessionResult, ExpandedSavedSessionResult } from './dtos/session-results';
