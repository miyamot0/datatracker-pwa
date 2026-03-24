import { WorkerMessage, WorkerResponse } from '../types/sync-worker-types';
import { listFilesInDirectory, syncFiles } from '../../../lib/sync-utils';

export class SyncWorkerHandler {
  /**
   * Handles LIST_FILES_LOCAL message
   */
  async handleListLocalFiles(data: Extract<WorkerMessage, { type: 'LIST_FILES_LOCAL' }>): Promise<WorkerResponse> {
    console.log('Listing local files...');
    try {
      const files = await listFilesInDirectory(data.localHandle);
      console.log('Found local files:', files.length);
      return { type: 'FILES_LISTED_LOCAL', files };
    } catch (error) {
      console.error('Error listing local files:', error);
      throw error;
    }
  }

  /**
   * Handles LIST_FILES_REMOTE message
   */
  async handleListRemoteFiles(data: Extract<WorkerMessage, { type: 'LIST_FILES_REMOTE' }>): Promise<WorkerResponse> {
    console.log('Listing remote files...');
    const files = await listFilesInDirectory(data.remoteHandle);
    console.log('Found remote files:', files.length);
    return { type: 'FILES_LISTED_REMOTE', files };
  }

  /**
   * Handles LIST_FILES_BOTH message
   */
  async handleListBothFiles(data: Extract<WorkerMessage, { type: 'LIST_FILES_BOTH' }>): Promise<WorkerResponse> {
    console.log('Listing both local and remote files...');
    const [localFiles, remoteFiles] = await Promise.all([
      listFilesInDirectory(data.localHandle),
      listFilesInDirectory(data.remoteHandle),
    ]);
    console.log('Found files - local:', localFiles.length, 'remote:', remoteFiles.length);
    return {
      type: 'FILES_LISTED_BOTH',
      localFiles,
      remoteFiles,
    };
  }

  /**
   * Handles SYNC_FILES message
   */
  async handleSyncFiles(data: Extract<WorkerMessage, { type: 'SYNC_FILES' }>): Promise<WorkerResponse> {
    console.log('Syncing files...');
    const syncedFiles = await syncFiles(data.rows, data.sourceHandle, data.targetHandle);
    console.log('Synced files:', syncedFiles.length);
    return {
      type: 'FILES_SYNCED',
      syncedFiles,
      direction: data.direction,
    };
  }

  /**
   * Main message processing method
   */
  async processMessage(data: WorkerMessage): Promise<WorkerResponse> {
    switch (data.type) {
      case 'LIST_FILES_LOCAL':
        return this.handleListLocalFiles(data);

      case 'LIST_FILES_REMOTE':
        return this.handleListRemoteFiles(data);

      case 'LIST_FILES_BOTH':
        return this.handleListBothFiles(data);

      case 'SYNC_FILES':
        return this.handleSyncFiles(data);

      default:
        throw new Error(`Unknown operation type: ${(data as any).type}`);
    }
  }
}
