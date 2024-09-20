/* eslint-disable @typescript-eslint/no-explicit-any */
import { Mock } from 'vitest';
import {
  getClientEvaluationFolders,
  getGroupFolders,
  getIndividualClientFolders,
  removeClientEvaluationFolder,
  removeClientFolder,
  removeGroupFolder,
} from '../folders';
import { CleanUpString } from '../strings';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('File System Folder Functions', () => {
  let mockHandle: any;
  let mockSetGroups: Mock;
  let mockSetIndividuals: Mock;
  let mockSetEvaluations: Mock;

  beforeEach(() => {
    mockHandle = {
      getDirectoryHandle: vi.fn(),
      values: vi.fn(),
    };
    mockSetGroups = vi.fn();
    mockSetIndividuals = vi.fn();
    mockSetEvaluations = vi.fn();
    vi.clearAllMocks();
  });

  describe('getGroupFolders', () => {
    it('should fetch group folders and update state', async () => {
      const mockEntries = [
        { kind: 'directory', name: 'group1' },
        { kind: 'directory', name: 'group2' },
        { kind: 'file', name: 'file.txt' },
      ];

      mockHandle.values.mockResolvedValue(mockEntries);

      await getGroupFolders(mockHandle, mockSetGroups);

      expect(mockHandle.values).toHaveBeenCalled();
      expect(mockSetGroups).toHaveBeenCalledWith({
        Status: 'complete',
        Values: ['group1', 'group2'],
      });
    });

    it('should handle errors and set error state', async () => {
      const mockError = new Error('Failed to get group folders');
      mockHandle.values.mockRejectedValue(mockError);

      await getGroupFolders(mockHandle, mockSetGroups);

      expect(mockSetGroups).toHaveBeenCalledWith({
        Status: 'error',
        Values: [],
        Error: mockError as unknown as string,
      });
    });
  });

  describe('getIndividualClientFolders', () => {
    it('should fetch individual client folders and update state', async () => {
      const mockGroupHandle = {
        values: vi.fn(),
      };

      const mockEntries = [
        { kind: 'directory', name: 'client1' },
        { kind: 'directory', name: 'client2' },
      ];

      mockHandle.getDirectoryHandle.mockResolvedValue(mockGroupHandle);
      mockGroupHandle.values.mockResolvedValue(mockEntries);

      await getIndividualClientFolders(mockHandle, 'group1', mockSetIndividuals);

      expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith(CleanUpString('group1'));
      expect(mockGroupHandle.values).toHaveBeenCalled();
      expect(mockSetIndividuals).toHaveBeenCalledWith({
        Status: 'complete',
        Values: ['client1', 'client2'],
      });
    });

    it('should handle errors and set error state', async () => {
      const mockError = new Error('Failed to get individual folders');
      mockHandle.getDirectoryHandle.mockRejectedValue(mockError);

      await getIndividualClientFolders(mockHandle, 'group1', mockSetIndividuals);

      expect(mockSetIndividuals).toHaveBeenCalledWith({
        Status: 'error',
        Values: [],
        Error: mockError as unknown as string,
      });
    });
  });

  describe('getClientEvaluationFolders', () => {
    it('should fetch evaluation folders and update state', async () => {
      const mockGroupFolder = {
        getDirectoryHandle: vi.fn(),
      };

      const mockIndividualFolder = {
        values: vi.fn(),
      };

      const mockEntries = [
        { kind: 'directory', name: 'evaluation1' },
        { kind: 'directory', name: 'evaluation2' },
      ];

      mockHandle.getDirectoryHandle.mockResolvedValue(mockGroupFolder);
      mockGroupFolder.getDirectoryHandle.mockResolvedValue(mockIndividualFolder);
      mockIndividualFolder.values.mockResolvedValue(mockEntries);

      await getClientEvaluationFolders(mockHandle, 'group1', 'client1', mockSetEvaluations);

      expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith('group1');
      expect(mockGroupFolder.getDirectoryHandle).toHaveBeenCalledWith('client1');
      expect(mockIndividualFolder.values).toHaveBeenCalled();
      expect(mockSetEvaluations).toHaveBeenCalledWith({
        Status: 'complete',
        Values: ['evaluation1', 'evaluation2'],
      });
    });

    it('should handle errors and set error state', async () => {
      const mockError = new Error('Failed to get evaluation folders');
      const mockGroupFolder = {
        getDirectoryHandle: vi.fn().mockRejectedValue(mockError),
      };

      mockHandle.getDirectoryHandle.mockResolvedValue(mockGroupFolder);

      await getClientEvaluationFolders(mockHandle, 'group1', 'client1', mockSetEvaluations);

      expect(mockSetEvaluations).toHaveBeenCalledWith({
        Status: 'error',
        Values: [],
        Error: mockError as unknown as string,
      });
    });
  });
});

describe('Remove Folder Functions', () => {
  let mockHandle: any;

  beforeEach(() => {
    mockHandle = {
      requestPermission: vi.fn(),
      removeEntry: vi.fn(),
      getDirectoryHandle: vi.fn(),
    };
    vi.clearAllMocks();
  });

  describe('removeGroupFolder', () => {
    it('should remove the group folder if permission is granted', async () => {
      mockHandle.requestPermission.mockResolvedValue('granted');
      mockHandle.removeEntry.mockResolvedValue(undefined);

      await removeGroupFolder(mockHandle, 'testGroup');

      expect(mockHandle.requestPermission).toHaveBeenCalledWith({
        mode: 'readwrite',
      });
      expect(mockHandle.removeEntry).toHaveBeenCalledWith('testGroup', {
        recursive: true,
      });
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should show error toast if permission is denied', async () => {
      mockHandle.requestPermission.mockResolvedValue('denied');

      await removeGroupFolder(mockHandle, 'testGroup');

      expect(mockHandle.requestPermission).toHaveBeenCalledWith({
        mode: 'readwrite',
      });
      expect(toast.error).toHaveBeenCalledWith('Permission denied to remove group folder.');
      expect(mockHandle.removeEntry).not.toHaveBeenCalled();
    });
  });

  describe('removeClientFolder', () => {
    it('should remove the client folder if permission is granted', async () => {
      const mockGroupDir = {
        removeEntry: vi.fn().mockResolvedValue(undefined),
      };

      mockHandle.requestPermission.mockResolvedValue('granted');
      mockHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);

      await removeClientFolder(mockHandle, 'testGroup', 'testClient');

      expect(mockHandle.requestPermission).toHaveBeenCalledWith({
        mode: 'readwrite',
      });
      expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith(CleanUpString('testGroup'));
      expect(mockGroupDir.removeEntry).toHaveBeenCalledWith('testClient', {
        recursive: true,
      });
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should show error toast if permission is denied', async () => {
      mockHandle.requestPermission.mockResolvedValue('denied');

      await removeClientFolder(mockHandle, 'testGroup', 'testClient');

      expect(mockHandle.requestPermission).toHaveBeenCalledWith({
        mode: 'readwrite',
      });
      expect(toast.error).toHaveBeenCalledWith('Permission denied to remove group folder.');
      expect(mockHandle.getDirectoryHandle).not.toHaveBeenCalled();
    });
  });

  describe('removeClientEvaluationFolder', () => {
    it('should remove the evaluation folder if permission is granted', async () => {
      const mockGroupDir = { getDirectoryHandle: vi.fn() };
      const mockClientDir = {
        removeEntry: vi.fn().mockResolvedValue(undefined),
      };

      mockHandle.requestPermission.mockResolvedValue('granted');
      mockHandle.getDirectoryHandle.mockResolvedValueOnce(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValueOnce(mockClientDir);

      await removeClientEvaluationFolder(mockHandle, 'testGroup', 'testClient', 'testEvaluation');

      expect(mockHandle.requestPermission).toHaveBeenCalledWith({
        mode: 'readwrite',
      });
      expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith(CleanUpString('testGroup'));
      expect(mockGroupDir.getDirectoryHandle).toHaveBeenCalledWith(CleanUpString('testClient'));
      expect(mockClientDir.removeEntry).toHaveBeenCalledWith(CleanUpString('testEvaluation'), {
        recursive: true,
      });
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should show error toast if permission is denied', async () => {
      mockHandle.requestPermission.mockResolvedValue('denied');

      await removeClientEvaluationFolder(mockHandle, 'testGroup', 'testClient', 'testEvaluation');

      expect(mockHandle.requestPermission).toHaveBeenCalledWith({
        mode: 'readwrite',
      });
      expect(toast.error).toHaveBeenCalledWith('Permission denied to remove group folder.');
      expect(mockHandle.getDirectoryHandle).not.toHaveBeenCalled();
    });
  });
});
