/**
 * Type for file syncing status, which indicates whether a file is being synced to a remote location or from a remote location. This type is used to represent the direction of file synchronization within the application, providing a clear and organized way to manage file syncing operations.
 */
export type FileSyncingStatus = 'to_remote' | 'from_remote';

/**
 * Type for a row in the sync entry table, which includes the file name, the direction of synchronization (to or from remote), and the status of the synchronization process. This type is used to represent individual entries in a table that tracks file synchronization activities, allowing for easy display and management of syncing operations within the application's dashboard.
 */
export type SyncEntryTableRow = {
  id?: string;
  file: string;
  direction: string;
  status: string;
};

export type { ParsedSyncFile } from '../workers/sync/types/sync-worker-types';
