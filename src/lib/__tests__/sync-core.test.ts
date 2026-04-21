import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncWorkerHandler } from '../sync-core';
import { listFilesInDirectory, syncFiles } from '../sync-utils';

vi.mock('../sync-utils');

describe('SyncWorkerHandler', () => {
  let handler: SyncWorkerHandler;
  const mockHandle = {} as FileSystemDirectoryHandle;
  const mockHandle2 = {} as FileSystemDirectoryHandle;

  beforeEach(() => {
    handler = new SyncWorkerHandler();
    vi.clearAllMocks();
  });

  describe('handleListLocalFiles', () => {
    it('should return local files list on success', async () => {
      vi.mocked(listFilesInDirectory).mockResolvedValue(['/file1.json', '/file2.json']);

      const result = await handler.handleListLocalFiles({ type: 'LIST_FILES_LOCAL', localHandle: mockHandle });

      expect(result).toEqual({ type: 'FILES_LISTED_LOCAL', files: ['/file1.json', '/file2.json'] });
      expect(listFilesInDirectory).toHaveBeenCalledWith(mockHandle);
    });

    it('should return empty array when directory has no files', async () => {
      vi.mocked(listFilesInDirectory).mockResolvedValue([]);

      const result = await handler.handleListLocalFiles({ type: 'LIST_FILES_LOCAL', localHandle: mockHandle });

      expect(result).toEqual({ type: 'FILES_LISTED_LOCAL', files: [] });
    });

    it('should throw error when listing local files fails', async () => {
      const error = new Error('Directory read failed');
      vi.mocked(listFilesInDirectory).mockRejectedValue(error);

      await expect(
        handler.handleListLocalFiles({ type: 'LIST_FILES_LOCAL', localHandle: mockHandle }),
      ).rejects.toThrow('Directory read failed');
    });
  });

  describe('handleListRemoteFiles', () => {
    it('should return remote files list', async () => {
      vi.mocked(listFilesInDirectory).mockResolvedValue(['/remote1.json', '/remote2.json']);

      const result = await handler.handleListRemoteFiles({ type: 'LIST_FILES_REMOTE', remoteHandle: mockHandle });

      expect(result).toEqual({ type: 'FILES_LISTED_REMOTE', files: ['/remote1.json', '/remote2.json'] });
      expect(listFilesInDirectory).toHaveBeenCalledWith(mockHandle);
    });

    it('should return empty array when remote directory has no files', async () => {
      vi.mocked(listFilesInDirectory).mockResolvedValue([]);

      const result = await handler.handleListRemoteFiles({ type: 'LIST_FILES_REMOTE', remoteHandle: mockHandle });

      expect(result).toEqual({ type: 'FILES_LISTED_REMOTE', files: [] });
    });
  });

  describe('handleListBothFiles', () => {
    it('should return both local and remote files', async () => {
      vi.mocked(listFilesInDirectory)
        .mockResolvedValueOnce(['/local1.json', '/local2.json'])
        .mockResolvedValueOnce(['/remote1.json']);

      const result = await handler.handleListBothFiles({
        type: 'LIST_FILES_BOTH',
        localHandle: mockHandle,
        remoteHandle: mockHandle2,
      });

      expect(result).toEqual({
        type: 'FILES_LISTED_BOTH',
        localFiles: ['/local1.json', '/local2.json'],
        remoteFiles: ['/remote1.json'],
      });
      expect(listFilesInDirectory).toHaveBeenCalledTimes(2);
      expect(listFilesInDirectory).toHaveBeenCalledWith(mockHandle);
      expect(listFilesInDirectory).toHaveBeenCalledWith(mockHandle2);
    });

    it('should return empty arrays when both directories are empty', async () => {
      vi.mocked(listFilesInDirectory).mockResolvedValue([]);

      const result = await handler.handleListBothFiles({
        type: 'LIST_FILES_BOTH',
        localHandle: mockHandle,
        remoteHandle: mockHandle2,
      });

      expect(result).toEqual({ type: 'FILES_LISTED_BOTH', localFiles: [], remoteFiles: [] });
    });
  });

  describe('handleSyncFiles', () => {
    it('should sync files and return synced list with direction to_remote', async () => {
      vi.mocked(syncFiles).mockResolvedValue(['/file1.json', '/file2.json']);

      const rows = [
        { file: '/file1.json', direction: 'to_remote', status: 'pending' },
        { file: '/file2.json', direction: 'to_remote', status: 'pending' },
      ];
      const result = await handler.handleSyncFiles({
        type: 'SYNC_FILES',
        rows,
        sourceHandle: mockHandle,
        targetHandle: mockHandle2,
        direction: 'to_remote',
      });

      expect(result).toEqual({
        type: 'FILES_SYNCED',
        syncedFiles: ['/file1.json', '/file2.json'],
        direction: 'to_remote',
      });
      expect(syncFiles).toHaveBeenCalledWith(rows, mockHandle, mockHandle2);
    });

    it('should sync files with direction from_remote', async () => {
      vi.mocked(syncFiles).mockResolvedValue(['/remote-file.json']);

      const rows = [{ file: '/remote-file.json', direction: 'from_remote', status: 'pending' }];
      const result = await handler.handleSyncFiles({
        type: 'SYNC_FILES',
        rows,
        sourceHandle: mockHandle2,
        targetHandle: mockHandle,
        direction: 'from_remote',
      });

      expect(result).toEqual({
        type: 'FILES_SYNCED',
        syncedFiles: ['/remote-file.json'],
        direction: 'from_remote',
      });
    });

    it('should return empty synced files array when nothing to sync', async () => {
      vi.mocked(syncFiles).mockResolvedValue([]);

      const result = await handler.handleSyncFiles({
        type: 'SYNC_FILES',
        rows: [],
        sourceHandle: mockHandle,
        targetHandle: mockHandle2,
        direction: 'to_remote',
      });

      expect(result).toEqual({ type: 'FILES_SYNCED', syncedFiles: [], direction: 'to_remote' });
    });
  });

  describe('processMessage', () => {
    it('should handle LIST_FILES_LOCAL message', async () => {
      vi.mocked(listFilesInDirectory).mockResolvedValue(['/file.json']);

      const result = await handler.processMessage({ type: 'LIST_FILES_LOCAL', localHandle: mockHandle });

      expect(result).toEqual({ type: 'FILES_LISTED_LOCAL', files: ['/file.json'] });
    });

    it('should handle LIST_FILES_REMOTE message', async () => {
      vi.mocked(listFilesInDirectory).mockResolvedValue(['/remote.json']);

      const result = await handler.processMessage({ type: 'LIST_FILES_REMOTE', remoteHandle: mockHandle });

      expect(result).toEqual({ type: 'FILES_LISTED_REMOTE', files: ['/remote.json'] });
    });

    it('should handle LIST_FILES_BOTH message', async () => {
      vi.mocked(listFilesInDirectory)
        .mockResolvedValueOnce(['/local.json'])
        .mockResolvedValueOnce(['/remote.json']);

      const result = await handler.processMessage({
        type: 'LIST_FILES_BOTH',
        localHandle: mockHandle,
        remoteHandle: mockHandle2,
      });

      expect(result).toEqual({
        type: 'FILES_LISTED_BOTH',
        localFiles: ['/local.json'],
        remoteFiles: ['/remote.json'],
      });
    });

    it('should handle SYNC_FILES message', async () => {
      vi.mocked(syncFiles).mockResolvedValue(['/synced.json']);

      const rows = [{ file: '/synced.json', direction: 'from_remote', status: 'pending' }];
      const result = await handler.processMessage({
        type: 'SYNC_FILES',
        rows,
        sourceHandle: mockHandle,
        targetHandle: mockHandle2,
        direction: 'from_remote',
      });

      expect(result).toEqual({
        type: 'FILES_SYNCED',
        syncedFiles: ['/synced.json'],
        direction: 'from_remote',
      });
    });

    it('should throw for unknown message type', async () => {
      await expect(handler.processMessage({ type: 'UNKNOWN' } as any)).rejects.toThrow(
        'Unknown operation type: UNKNOWN',
      );
    });

    it('should propagate errors from handleListLocalFiles through processMessage', async () => {
      vi.mocked(listFilesInDirectory).mockRejectedValue(new Error('Access denied'));

      await expect(
        handler.processMessage({ type: 'LIST_FILES_LOCAL', localHandle: mockHandle }),
      ).rejects.toThrow('Access denied');
    });
  });
});
