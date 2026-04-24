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

/**
 * Messages sent to the sync worker, which can be for listing files in local or remote directories, or for syncing files between them
 */
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

/**
 * Messages received from the sync worker, which can include lists of files from local or remote directories, results of syncing operations, or error messages
 */
export type WorkerResponse =
  | { type: 'FILES_LISTED_LOCAL'; files: ParsedSyncFile[] }
  | { type: 'FILES_LISTED_REMOTE'; files: ParsedSyncFile[] }
  | { type: 'FILES_LISTED_BOTH'; localFiles: ParsedSyncFile[]; remoteFiles: ParsedSyncFile[] }
  | { type: 'FILES_SYNCED'; syncedFiles: string[]; direction: 'to_remote' | 'from_remote' }
  | { type: 'ERROR'; message: string; operation: string };
