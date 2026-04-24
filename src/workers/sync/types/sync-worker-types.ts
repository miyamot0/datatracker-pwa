/**
 * Types related to file sync operations
 */

export interface SyncEntryTableRow {
  file: string;
  direction: string;
  status: string;
}

/**
 * A file entry returned from directory listing with parsed path segments
 */
export interface ParsedSyncFile {
  /** Full relative path, e.g. "/Group/Individual/Evaluation.json" */
  file: string;
  group: string;
  individual: string;
  evaluation: string;
}

export type WorkerMessage =
  | { type: 'LIST_FILES_LOCAL'; localHandle: FileSystemDirectoryHandle }
  | { type: 'LIST_FILES_REMOTE'; remoteHandle: FileSystemDirectoryHandle }
  | { type: 'LIST_FILES_BOTH'; localHandle: FileSystemDirectoryHandle; remoteHandle: FileSystemDirectoryHandle }
  | {
      type: 'SYNC_FILES';
      rows: SyncEntryTableRow[];
      sourceHandle: FileSystemDirectoryHandle;
      targetHandle: FileSystemDirectoryHandle;
      direction: 'to_remote' | 'from_remote';
    };

export type WorkerResponse =
  | { type: 'FILES_LISTED_LOCAL'; files: ParsedSyncFile[] }
  | { type: 'FILES_LISTED_REMOTE'; files: ParsedSyncFile[] }
  | { type: 'FILES_LISTED_BOTH'; localFiles: ParsedSyncFile[]; remoteFiles: ParsedSyncFile[] }
  | { type: 'FILES_SYNCED'; syncedFiles: string[]; direction: 'to_remote' | 'from_remote' }
  | { type: 'ERROR'; message: string; operation: string };

export type SyncDirection = 'to_remote' | 'from_remote';
