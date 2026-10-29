/**
 * Types related to file sync operations
 */
export interface SyncEntryTableRow {
  file: string;
  direction: string;
  status: string;
}

/**
 * Categorization of a synced file based on its path structure
 */
export type SyncFileType = 'session_outcome' | 'session_parameters' | 'figure_styles' | 'keyset';

/**
 * A file entry returned from directory listing with parsed path segments
 */
export interface ParsedSyncFile {
  /** Note: relative path, e.g. "/Group/Individual/Evaluation.json" */
  file: string;
  group: string;
  individual: string;
  evaluation: string;
  condition: string;
  type: SyncFileType;
}
