import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import {
  isSystemFile,
  fetchDirectories,
  fetchGroups,
  fetchClients,
  fetchEvaluations,
  fetchEvaluationsAll,
  fetchConditions,
  fetchKeysets,
  fetchKeysetsAll,
  fetchSessionParams,
  fetchSessionOutcomes,
} from '../queries/helpers/file-query-read-actions';
import { deserializeKeySet } from '@/lib/keyset';
import { CleanUpString } from '@/lib/strings';
import { readKeyboardParameters } from '@/lib/reader';
import { DEFAULT_SESSION_SETTINGS } from '@/lib/dtos';

// Mock dependencies
vi.mock('@/lib/keyset');
vi.mock('@/lib/strings');
vi.mock('@/lib/reader');

const mockedDeserializeKeySet = vi.mocked(deserializeKeySet);
const mockedCleanUpString = vi.mocked(CleanUpString);
const mockedReadKeyboardParameters = vi.mocked(readKeyboardParameters);

// Mock FileSystem API interfaces (reusing from mutation tests)
interface MockFileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

interface MockFileSystemDirectoryHandle extends MockFileSystemHandle {
  kind: 'directory';
  entries: Mock;
  values: Mock;
  getDirectoryHandle: Mock;
  getFileHandle: Mock;
}

interface MockFileSystemFileHandle extends MockFileSystemHandle {
  kind: 'file';
  getFile: Mock;
  createWritable: Mock;
}

interface MockFile {
  text: Mock;
}

interface MockWritableStream {
  write: Mock;
  close: Mock;
}

function createMockDirectoryHandle(name: string = 'test'): MockFileSystemDirectoryHandle {
  const handle = {
    kind: 'directory' as const,
    name,
    entries: vi.fn(),
    values: vi.fn(),
    getDirectoryHandle: vi.fn(),
    getFileHandle: vi.fn(),
  };

  // Set default resolved values
  handle.getDirectoryHandle.mockImplementation((dirName: string) =>
    Promise.resolve(createMockDirectoryHandle(dirName)),
  );
  handle.getFileHandle.mockImplementation((fileName: string) => Promise.resolve(createMockFileHandle(fileName)));

  return handle;
}

function createMockFileHandle(name: string = 'test.json'): MockFileSystemFileHandle {
  return {
    kind: 'file',
    name,
    getFile: vi.fn(),
    createWritable: vi.fn(),
  };
}

function createMockFile(content: string = '{}'): MockFile {
  return {
    text: vi.fn().mockResolvedValue(content),
  };
}

function createMockWritableStream(): MockWritableStream {
  return {
    write: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
  };
}

// Helper function to create async iterators
function createAsyncIterator<T>(items: T[]): AsyncIterableIterator<T> {
  let index = 0;
  return {
    [Symbol.asyncIterator]() {
      return this;
    },
    async next() {
      if (index < items.length) {
        return { value: items[index++], done: false };
      } else {
        return { done: true, value: undefined };
      }
    },
  };
}

// Helper function to create entries iterator
function createEntriesIterator(
  entries: Array<[string, MockFileSystemHandle]>,
): AsyncIterableIterator<[string, MockFileSystemHandle]> {
  return createAsyncIterator(entries);
}

describe('file-query-read-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCleanUpString.mockImplementation((str: string) => str.trim());
  });

  describe('isSystemFile', () => {
    it('should identify system files correctly', () => {
      expect(isSystemFile('.DS_Store')).toBe(true);
      expect(isSystemFile('.git')).toBe(true);
      expect(isSystemFile('.hidden')).toBe(true);
      expect(isSystemFile('Thumbs.db')).toBe(true);
      expect(isSystemFile('desktop.ini')).toBe(true);
    });

    it('should not identify regular files as system files', () => {
      expect(isSystemFile('regular-file.txt')).toBe(false);
      expect(isSystemFile('folder')).toBe(false);
      expect(isSystemFile('data.json')).toBe(false);
      expect(isSystemFile('evaluation')).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isSystemFile('')).toBe(false);
      expect(isSystemFile('file.DS_Store')).toBe(false); // contains but doesn't equal
      expect(isSystemFile('file.thumbs.db')).toBe(false); // case sensitive
    });
  });

  describe('fetchDirectories', () => {
    let mockRootHandle: MockFileSystemDirectoryHandle;

    beforeEach(() => {
      mockRootHandle = createMockDirectoryHandle('root');
    });

    it('should fetch directories from root', async () => {
      const mockDir1 = createMockDirectoryHandle('dir1');
      const mockDir2 = createMockDirectoryHandle('dir2');
      const mockFile = createMockFileHandle('file.txt');

      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['dir1', mockDir1],
          ['file.txt', mockFile],
          ['dir2', mockDir2],
        ]),
      );

      const result = await fetchDirectories(mockRootHandle as any);

      expect(result).toEqual(['dir1', 'dir2']); // sorted and files excluded
    });

    it('should exclude system files by default', async () => {
      const mockDir = createMockDirectoryHandle('regular-dir');
      const mockSystemDir = createMockDirectoryHandle('.DS_Store');

      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['regular-dir', mockDir],
          ['.DS_Store', mockSystemDir],
          ['Thumbs.db', mockSystemDir],
        ]),
      );

      const result = await fetchDirectories(mockRootHandle as any);

      expect(result).toEqual(['regular-dir']);
    });

    it('should include system files when excludeSystemFiles is false', async () => {
      const mockRegularDir = createMockDirectoryHandle('regular-dir');
      const mockSystemDir = createMockDirectoryHandle('.DS_Store');

      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['regular-dir', mockRegularDir],
          ['.DS_Store', mockSystemDir],
        ]),
      );

      const result = await fetchDirectories(mockRootHandle as any, { excludeSystemFiles: false });

      expect(result).toEqual(['.DS_Store', 'regular-dir']); // sorted
    });

    it('should navigate to specified path before listing', async () => {
      const mockSubDir = createMockDirectoryHandle('subdir');
      const mockFinalDir = createMockDirectoryHandle('finaldir');

      mockRootHandle.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'group1') return Promise.resolve(mockSubDir);
        throw new Error('Not found');
      });

      mockSubDir.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'individual1') return Promise.resolve(mockFinalDir);
        throw new Error('Not found');
      });

      mockFinalDir.entries.mockReturnValue(
        createEntriesIterator([['evaluation1', createMockDirectoryHandle('evaluation1')]]),
      );

      const result = await fetchDirectories(mockRootHandle as any, {
        path: ['group1', 'individual1'],
      });

      expect(mockRootHandle.getDirectoryHandle).toHaveBeenCalledWith('group1');
      expect(mockSubDir.getDirectoryHandle).toHaveBeenCalledWith('individual1');
      expect(result).toEqual(['evaluation1']);
    });

    it('should return empty array when path does not exist', async () => {
      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Path not found'));

      const result = await fetchDirectories(mockRootHandle as any, {
        path: ['nonexistent'],
      });

      expect(result).toEqual([]);
    });

    it('should apply filter pattern when provided', async () => {
      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['eval-session-1', createMockDirectoryHandle('eval-session-1')],
          ['eval-session-2', createMockDirectoryHandle('eval-session-2')],
          ['other-folder', createMockDirectoryHandle('other-folder')],
        ]),
      );

      const result = await fetchDirectories(mockRootHandle as any, {
        filterPattern: /^eval-session-/,
      });

      expect(result).toEqual(['eval-session-1', 'eval-session-2']);
    });

    it('should handle errors gracefully', async () => {
      mockRootHandle.entries.mockRejectedValue(new Error('Access denied'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await fetchDirectories(mockRootHandle as any);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching directories:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should sort results alphabetically', async () => {
      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['zebra', createMockDirectoryHandle('zebra')],
          ['alpha', createMockDirectoryHandle('alpha')],
          ['beta', createMockDirectoryHandle('beta')],
        ]),
      );

      const result = await fetchDirectories(mockRootHandle as any);

      expect(result).toEqual(['alpha', 'beta', 'zebra']);
    });
  });

  describe('fetchGroups', () => {
    it('should fetch groups using fetchDirectories', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['group1', createMockDirectoryHandle('group1')],
          ['group2', createMockDirectoryHandle('group2')],
        ]),
      );

      const result = await fetchGroups(mockRootHandle as any);

      expect(result).toEqual(['group1', 'group2']);
    });

    it('should exclude system files', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['group1', createMockDirectoryHandle('group1')],
          ['.DS_Store', createMockDirectoryHandle('.DS_Store')],
        ]),
      );

      const result = await fetchGroups(mockRootHandle as any);

      expect(result).toEqual(['group1']);
    });
  });

  describe('fetchClients', () => {
    it('should fetch clients within a group', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.entries.mockReturnValue(
        createEntriesIterator([
          ['client1', createMockDirectoryHandle('client1')],
          ['client2', createMockDirectoryHandle('client2')],
        ]),
      );

      const result = await fetchClients(mockRootHandle as any, 'group1');

      expect(mockRootHandle.getDirectoryHandle).toHaveBeenCalledWith('group1');
      expect(result).toEqual(['client1', 'client2']);
    });
  });

  describe('fetchEvaluations', () => {
    let mockRootHandle: MockFileSystemDirectoryHandle;

    beforeEach(() => {
      mockRootHandle = createMockDirectoryHandle('root');
    });

    it('should fetch evaluations for a group without specific client', async () => {
      const mockGroupDir = createMockDirectoryHandle('group1');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.entries.mockReturnValue(
        createEntriesIterator([
          ['evaluation1', createMockDirectoryHandle('evaluation1')],
          ['evaluation2', createMockDirectoryHandle('evaluation2')],
        ]),
      );

      const result = await fetchEvaluations(mockRootHandle as any, 'group1');

      expect(result).toEqual(['evaluation1', 'evaluation2']);
    });

    it('should fetch evaluations for a specific client', async () => {
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockClientDir = createMockDirectoryHandle('client1');

      mockRootHandle.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'group1') return Promise.resolve(mockGroupDir);
        throw new Error('Not found');
      });

      mockGroupDir.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'client1') return Promise.resolve(mockClientDir);
        throw new Error('Not found');
      });

      mockClientDir.entries.mockReturnValue(
        createEntriesIterator([['evaluation1', createMockDirectoryHandle('evaluation1')]]),
      );

      const result = await fetchEvaluations(mockRootHandle as any, 'group1', 'client1');

      expect(result).toEqual(['evaluation1']);
    });
  });

  describe('fetchEvaluationsAll', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should fetch all evaluations from complete structure', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroup1 = createMockDirectoryHandle('group1');
      const mockIndividual1 = createMockDirectoryHandle('individual1');
      const mockEvaluation1 = createMockDirectoryHandle('evaluation1');
      const mockCondition1 = createMockDirectoryHandle('condition1');

      // Setup root entries
      mockRootHandle.entries.mockReturnValue(createEntriesIterator([['group1', mockGroup1]]));

      // Setup group entries
      mockRootHandle.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'group1') return Promise.resolve(mockGroup1);
        throw new Error('Not found');
      });

      mockGroup1.entries.mockReturnValue(createEntriesIterator([['individual1', mockIndividual1]]));

      // Setup individual entries
      mockGroup1.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'individual1') return Promise.resolve(mockIndividual1);
        throw new Error('Not found');
      });

      mockIndividual1.entries.mockReturnValue(createEntriesIterator([['evaluation1', mockEvaluation1]]));

      // Setup evaluation entries
      mockIndividual1.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'evaluation1') return Promise.resolve(mockEvaluation1);
        throw new Error('Not found');
      });

      mockEvaluation1.entries.mockReturnValue(createEntriesIterator([['condition1', mockCondition1]]));

      const result = await fetchEvaluationsAll(mockRootHandle as any);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        Group: 'group1',
        Individual: 'individual1',
        Evaluation: 'evaluation1',
        Conditions: ['condition1'],
      });
    });

    it('should skip .DS_Store files at all levels', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroup1 = createMockDirectoryHandle('group1');

      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['group1', mockGroup1],
          ['.DS_Store', createMockFileHandle('.DS_Store')],
        ]),
      );

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroup1);
      mockGroup1.entries.mockReturnValue(createEntriesIterator([]));

      const result = await fetchEvaluationsAll(mockRootHandle as any);

      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.entries.mockRejectedValue(new Error('Access denied'));

      const result = await fetchEvaluationsAll(mockRootHandle as any);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching all evaluations:', expect.any(Error));
    });

    it('should handle multiple groups and individuals', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroup1 = createMockDirectoryHandle('group1');
      const mockGroup2 = createMockDirectoryHandle('group2');
      const mockIndividual1 = createMockDirectoryHandle('individual1');
      const mockIndividual2 = createMockDirectoryHandle('individual2');
      const mockEvaluation1 = createMockDirectoryHandle('evaluation1');
      const mockEvaluation2 = createMockDirectoryHandle('evaluation2');

      // Root level
      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['group1', mockGroup1],
          ['group2', mockGroup2],
        ]),
      );

      mockRootHandle.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'group1') return Promise.resolve(mockGroup1);
        if (name === 'group2') return Promise.resolve(mockGroup2);
        throw new Error('Not found');
      });

      // Group 1
      mockGroup1.entries.mockReturnValue(createEntriesIterator([['individual1', mockIndividual1]]));
      mockGroup1.getDirectoryHandle.mockResolvedValue(mockIndividual1);

      // Group 2
      mockGroup2.entries.mockReturnValue(createEntriesIterator([['individual2', mockIndividual2]]));
      mockGroup2.getDirectoryHandle.mockResolvedValue(mockIndividual2);

      // Individuals
      mockIndividual1.entries.mockReturnValue(createEntriesIterator([['evaluation1', mockEvaluation1]]));
      mockIndividual1.getDirectoryHandle.mockResolvedValue(mockEvaluation1);

      mockIndividual2.entries.mockReturnValue(createEntriesIterator([['evaluation2', mockEvaluation2]]));
      mockIndividual2.getDirectoryHandle.mockResolvedValue(mockEvaluation2);

      // Evaluations (empty conditions)
      mockEvaluation1.entries.mockReturnValue(createEntriesIterator([]));
      mockEvaluation2.entries.mockReturnValue(createEntriesIterator([]));

      const result = await fetchEvaluationsAll(mockRootHandle as any);

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({
        Group: 'group1',
        Individual: 'individual1',
        Evaluation: 'evaluation1',
        Conditions: [],
      });
      expect(result).toContainEqual({
        Group: 'group2',
        Individual: 'individual2',
        Evaluation: 'evaluation2',
        Conditions: [],
      });
    });
  });

  describe('fetchConditions', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should fetch conditions for an evaluation', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation1');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);

      mockEvaluationDir.entries.mockReturnValue(
        createEntriesIterator([
          ['condition1', createMockDirectoryHandle('condition1')],
          ['condition2', createMockDirectoryHandle('condition2')],
          ['settings.json', createMockFileHandle('settings.json')],
        ]),
      );

      const result = await fetchConditions(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toEqual(['condition1', 'condition2']);
    });

    it('should exclude .DS_Store files', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation1');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);

      mockEvaluationDir.entries.mockReturnValue(
        createEntriesIterator([
          ['condition1', createMockDirectoryHandle('condition1')],
          ['.DS_Store', createMockDirectoryHandle('.DS_Store')],
        ]),
      );

      const result = await fetchConditions(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toEqual(['condition1']);
    });

    it('should handle errors gracefully', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Directory not found'));

      const result = await fetchConditions(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching conditions:', expect.any(Error));
    });
  });

  describe('fetchKeysets', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should fetch keysets for a group and individual', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockKeysetFile = createMockFileHandle('keyset1.json');
      const mockFile = createMockFile('{"Name": "TestKeyset", "id": "123"}');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockKeysetFile.getFile.mockResolvedValue(mockFile);

      mockIndividualDir.entries.mockReturnValue(
        createEntriesIterator([
          ['keyset1.json', mockKeysetFile],
          ['other-file.txt', createMockFileHandle('other-file.txt')],
        ]),
      );

      const mockKeyset = { Name: 'TestKeyset', id: '123' };
      mockedDeserializeKeySet.mockReturnValue(mockKeyset as any);

      const result = await fetchKeysets(mockRootHandle as any, 'group1', 'individual1');

      expect(mockFile.text).toHaveBeenCalled();
      expect(mockedDeserializeKeySet).toHaveBeenCalledWith('{"Name": "TestKeyset", "id": "123"}');
      expect(result).toEqual([mockKeyset]);
    });

    it('should skip .DS_Store files', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);

      mockIndividualDir.entries.mockReturnValue(
        createEntriesIterator([['.DS_Store', createMockFileHandle('.DS_Store')]]),
      );

      const result = await fetchKeysets(mockRootHandle as any, 'group1', 'individual1');

      expect(result).toEqual([]);
      expect(mockedDeserializeKeySet).not.toHaveBeenCalled();
    });

    it('should skip non-JSON files', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);

      mockIndividualDir.entries.mockReturnValue(
        createEntriesIterator([
          ['file.txt', createMockFileHandle('file.txt')],
          ['image.png', createMockFileHandle('image.png')],
        ]),
      );

      const result = await fetchKeysets(mockRootHandle as any, 'group1', 'individual1');

      expect(result).toEqual([]);
      expect(mockedDeserializeKeySet).not.toHaveBeenCalled();
    });

    it('should skip empty files', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockKeysetFile = createMockFileHandle('keyset1.json');
      const mockEmptyFile = createMockFile('');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockKeysetFile.getFile.mockResolvedValue(mockEmptyFile);

      mockIndividualDir.entries.mockReturnValue(createEntriesIterator([['keyset1.json', mockKeysetFile]]));

      const result = await fetchKeysets(mockRootHandle as any, 'group1', 'individual1');

      expect(result).toEqual([]);
      expect(mockedDeserializeKeySet).not.toHaveBeenCalled();
    });

    it('should skip files with null deserialization result', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockKeysetFile = createMockFileHandle('keyset1.json');
      const mockFile = createMockFile('invalid json');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockKeysetFile.getFile.mockResolvedValue(mockFile);

      mockIndividualDir.entries.mockReturnValue(createEntriesIterator([['keyset1.json', mockKeysetFile]]));

      // @ts-ignore
      mockedDeserializeKeySet.mockReturnValue(null);

      const result = await fetchKeysets(mockRootHandle as any, 'group1', 'individual1');

      expect(result).toEqual([]);
    });

    it('should handle errors gracefully', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Access denied'));

      const result = await fetchKeysets(mockRootHandle as any, 'group1', 'individual1');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching keysets:', expect.any(Error));
    });

    it('should create directories if they do not exist', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.entries.mockReturnValue(createEntriesIterator([]));

      const result = await fetchKeysets(mockRootHandle as any, 'group1', 'individual1');

      expect(mockRootHandle.getDirectoryHandle).toHaveBeenCalledWith('group1', { create: true });
      expect(mockGroupDir.getDirectoryHandle).toHaveBeenCalledWith('individual1', { create: true });
      expect(result).toEqual([]);
    });
  });

  describe('fetchKeysetsAll', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should fetch all keysets excluding specified individual', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroup1 = createMockDirectoryHandle('group1');
      const mockGroup2 = createMockDirectoryHandle('group2');
      const mockClient1 = createMockDirectoryHandle('client1');
      const mockClient2 = createMockDirectoryHandle('client2');
      const mockKeysetFile1 = createMockFileHandle('keyset1.json');
      const mockKeysetFile2 = createMockFileHandle('keyset2.json');

      // Setup root structure
      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['group1', mockGroup1],
          ['group2', mockGroup2],
        ]),
      );

      mockRootHandle.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'group1') return Promise.resolve(mockGroup1);
        if (name === 'group2') return Promise.resolve(mockGroup2);
        throw new Error('Not found');
      });

      // Setup groups
      mockGroup1.entries.mockReturnValue(createEntriesIterator([['client1', mockClient1]]));
      mockGroup1.getDirectoryHandle.mockResolvedValue(mockClient1);

      mockGroup2.entries.mockReturnValue(createEntriesIterator([['client2', mockClient2]]));
      mockGroup2.getDirectoryHandle.mockResolvedValue(mockClient2);

      // Setup clients
      mockClient1.entries.mockReturnValue(createEntriesIterator([['keyset1.json', mockKeysetFile1]]));

      mockClient2.entries.mockReturnValue(createEntriesIterator([['keyset2.json', mockKeysetFile2]]));

      // Mock keyboard reading
      const mockKeyset1 = { Name: 'Keyset1', id: '1' };
      const mockKeyset2 = { Name: 'Keyset2', id: '2' };

      mockedReadKeyboardParameters.mockImplementation((entry) => {
        if (entry.name === 'keyset1.json') return Promise.resolve(mockKeyset1 as any);
        if (entry.name === 'keyset2.json') return Promise.resolve(mockKeyset2 as any);
        return Promise.resolve(null);
      });

      const result = await fetchKeysetsAll(mockRootHandle as any, 'group1', 'client1');

      // Should exclude client1's keysets and return only client2's
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        ...mockKeyset2,
        Group: 'group2',
        Individual: 'client2',
      });
    });

    it('should skip .DS_Store files at all levels', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroup1 = createMockDirectoryHandle('group1');
      const mockClient1 = createMockDirectoryHandle('client1');

      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['group1', mockGroup1],
          ['.DS_Store', createMockFileHandle('.DS_Store')],
        ]),
      );

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroup1);

      mockGroup1.entries.mockReturnValue(
        createEntriesIterator([
          ['client1', mockClient1],
          ['.DS_Store', createMockDirectoryHandle('.DS_Store')],
        ]),
      );

      mockGroup1.getDirectoryHandle.mockResolvedValue(mockClient1);

      mockClient1.entries.mockReturnValue(createEntriesIterator([['.DS_Store', createMockFileHandle('.DS_Store')]]));

      const result = await fetchKeysetsAll(mockRootHandle as any, 'group1', 'client1');

      expect(result).toEqual([]);
    });

    it('should filter out keysets with matching names from current client', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroup1 = createMockDirectoryHandle('group1');
      const mockClient1 = createMockDirectoryHandle('client1');
      const mockClient2 = createMockDirectoryHandle('client2');
      const mockKeysetFile1 = createMockFileHandle('keyset1.json');
      const mockKeysetFile2 = createMockFileHandle('keyset2.json');

      mockRootHandle.entries.mockReturnValue(createEntriesIterator([['group1', mockGroup1]]));
      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroup1);

      mockGroup1.entries.mockReturnValue(
        createEntriesIterator([
          ['client1', mockClient1],
          ['client2', mockClient2],
        ]),
      );

      mockGroup1.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'client1') return Promise.resolve(mockClient1);
        if (name === 'client2') return Promise.resolve(mockClient2);
        throw new Error('Not found');
      });

      mockClient1.entries.mockReturnValue(createEntriesIterator([['keyset1.json', mockKeysetFile1]]));
      mockClient2.entries.mockReturnValue(createEntriesIterator([['keyset2.json', mockKeysetFile2]]));

      // Both have keysets with same name - should be filtered out
      const mockKeyset1 = { Name: 'SameKeyset', id: '1' };
      const mockKeyset2 = { Name: 'SameKeyset', id: '2' };

      mockedReadKeyboardParameters.mockImplementation((entry) => {
        if (entry.name === 'keyset1.json') return Promise.resolve(mockKeyset1 as any);
        if (entry.name === 'keyset2.json') return Promise.resolve(mockKeyset2 as any);
        return Promise.resolve(null);
      });

      const result = await fetchKeysetsAll(mockRootHandle as any, 'group1', 'client1');

      expect(result).toEqual([]); // Should be empty due to name matching
    });

    it('should handle keyboard reading errors gracefully', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroup1 = createMockDirectoryHandle('group1');
      const mockClient1 = createMockDirectoryHandle('client1');
      const mockKeysetFile = createMockFileHandle('keyset1.json');

      mockRootHandle.entries.mockReturnValue(createEntriesIterator([['group1', mockGroup1]]));
      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroup1);
      mockGroup1.entries.mockReturnValue(createEntriesIterator([['client1', mockClient1]]));
      mockGroup1.getDirectoryHandle.mockResolvedValue(mockClient1);
      mockClient1.entries.mockReturnValue(createEntriesIterator([['keyset1.json', mockKeysetFile]]));

      mockedReadKeyboardParameters.mockRejectedValue(new Error('Read error'));

      const result = await fetchKeysetsAll(mockRootHandle as any, 'group1', 'client1');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error reading keyboard keyset1.json:', expect.any(Error));
    });

    it('should handle overall errors gracefully', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.entries.mockRejectedValue(new Error('Access denied'));

      const result = await fetchKeysetsAll(mockRootHandle as any, 'group1', 'client1');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching all keysets:', expect.any(Error));
    });
  });

  describe('fetchSessionParams', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should fetch existing session parameters', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation1');
      const mockSettingsFile = createMockFileHandle('settings.json');
      const mockFile = createMockFile('{"sessionLength": 300, "condition": "test"}');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);
      mockEvaluationDir.getFileHandle.mockResolvedValue(mockSettingsFile);
      mockSettingsFile.getFile.mockResolvedValue(mockFile);

      const result = await fetchSessionParams(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(mockEvaluationDir.getFileHandle).toHaveBeenCalledWith('settings.json');
      expect(result).toEqual({ sessionLength: 300, condition: 'test' });
    });

    it('should create default settings when file does not exist', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation1');
      const mockSettingsFile = createMockFileHandle('settings.json');
      const mockWritable = createMockWritableStream();

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);

      // First call fails (file doesn't exist), second call succeeds (creates file)
      mockEvaluationDir.getFileHandle
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce(mockSettingsFile);

      mockSettingsFile.createWritable.mockResolvedValue(mockWritable);

      const result = await fetchSessionParams(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(mockEvaluationDir.getFileHandle).toHaveBeenCalledWith('settings.json');
      expect(mockEvaluationDir.getFileHandle).toHaveBeenCalledWith('settings.json', { create: true });
      expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(DEFAULT_SESSION_SETTINGS));
      expect(mockWritable.close).toHaveBeenCalled();
      expect(result).toEqual(DEFAULT_SESSION_SETTINGS);
    });

    it('should handle malformed settings file', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation1');
      const mockSettingsFile = createMockFileHandle('settings.json');
      const mockFile = createMockFile('invalid json');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);
      mockEvaluationDir.getFileHandle.mockResolvedValue(mockSettingsFile);
      mockSettingsFile.getFile.mockResolvedValue(mockFile);

      const result = await fetchSessionParams(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toEqual(DEFAULT_SESSION_SETTINGS);
    });

    it('should handle directory access errors', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Directory not found'));

      const result = await fetchSessionParams(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toEqual(DEFAULT_SESSION_SETTINGS);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching session params');
    });

    it('should handle file creation errors gracefully', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation1');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);

      // Both calls fail
      mockEvaluationDir.getFileHandle.mockRejectedValue(new Error('File access denied'));

      const result = await fetchSessionParams(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toEqual(DEFAULT_SESSION_SETTINGS);
      expect(consoleSpy).toHaveBeenCalledWith('Error creating default settings file');
    });
  });

  describe('fetchSessionOutcomes', () => {
    let consoleSpy: any;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should fetch session outcomes from files and condition folders', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation1');
      const mockConditionDir = createMockDirectoryHandle('condition1');
      const mockSettingsFile = createMockFileHandle('settings.json');
      const mockSessionFile1 = createMockFileHandle('session1.json');
      const mockSessionFile2 = createMockFileHandle('session2.json');
      const mockFile1 = createMockFile('{"SessionSettings": {"Session": "2024-01-01"}, "data": "test1"}');
      const mockFile2 = createMockFile('{"SessionSettings": {"Session": "2024-01-02"}, "data": "test2"}');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);

      // Setup evaluation entries
      mockEvaluationDir.entries.mockReturnValue(
        createEntriesIterator([
          ['settings.json', mockSettingsFile],
          ['condition1', mockConditionDir],
        ]),
      );

      mockEvaluationDir.getDirectoryHandle.mockResolvedValue(mockConditionDir);

      // Setup condition entries
      mockConditionDir.entries.mockReturnValue(
        createEntriesIterator([
          ['session1.json', mockSessionFile1],
          ['session2.json', mockSessionFile2],
        ]),
      );

      mockSessionFile1.getFile.mockResolvedValue(mockFile1);
      mockSessionFile2.getFile.mockResolvedValue(mockFile2);

      const result = await fetchSessionOutcomes(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toHaveLength(2);
      // Should be sorted by date descending (newest first)
      expect(result[0]).toEqual({
        SessionSettings: { Session: '2024-01-02' },
        data: 'test2',
        Filename: 'session2.json',
      });
      expect(result[1]).toEqual({
        SessionSettings: { Session: '2024-01-01' },
        data: 'test1',
        Filename: 'session1.json',
      });
    });

    it('should skip .DS_Store files', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation1');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);

      mockEvaluationDir.entries.mockReturnValue(
        createEntriesIterator([['.DS_Store', createMockFileHandle('.DS_Store')]]),
      );

      const result = await fetchSessionOutcomes(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toEqual([]);
    });

    it('should skip settings.json file', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation1');
      const mockSettingsFile = createMockFileHandle('settings.json');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);

      mockEvaluationDir.entries.mockReturnValue(createEntriesIterator([['settings.json', mockSettingsFile]]));

      const result = await fetchSessionOutcomes(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toEqual([]);
      expect(mockSettingsFile.getFile).not.toHaveBeenCalled();
    });

    it('should handle files directly in evaluation directory', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation1');
      const mockSessionFile = createMockFileHandle('session.json');
      const mockFile = createMockFile('{"SessionSettings": {"Session": "2024-01-01"}, "data": "direct"}');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);

      mockEvaluationDir.entries.mockReturnValue(createEntriesIterator([['session.json', mockSessionFile]]));

      mockSessionFile.getFile.mockResolvedValue(mockFile);

      const result = await fetchSessionOutcomes(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        SessionSettings: { Session: '2024-01-01' },
        data: 'direct',
        Filename: 'session.json',
      });
    });

    it('should handle file parsing errors gracefully', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation1');
      const mockSessionFile = createMockFileHandle('session.json');
      const mockInvalidFile = createMockFile('invalid json');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);

      mockEvaluationDir.entries.mockReturnValue(createEntriesIterator([['session.json', mockSessionFile]]));

      mockSessionFile.getFile.mockResolvedValue(mockInvalidFile);

      const result = await fetchSessionOutcomes(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error parsing session outcome file session.json:', expect.any(Error));
    });

    it('should handle directory access errors', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Directory not found'));

      const result = await fetchSessionOutcomes(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching session outcomes:', expect.any(Error));
    });

    it('should sort results by date descending', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group1');
      const mockIndividualDir = createMockDirectoryHandle('individual1');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation1');
      const mockSession1 = createMockFileHandle('session1.json');
      const mockSession2 = createMockFileHandle('session2.json');
      const mockSession3 = createMockFileHandle('session3.json');
      const mockFile1 = createMockFile('{"SessionSettings": {"Session": "2024-01-01"}}');
      const mockFile2 = createMockFile('{"SessionSettings": {"Session": "2024-01-03"}}');
      const mockFile3 = createMockFile('{"SessionSettings": {"Session": "2024-01-02"}}');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);

      mockEvaluationDir.entries.mockReturnValue(
        createEntriesIterator([
          ['session1.json', mockSession1],
          ['session2.json', mockSession2],
          ['session3.json', mockSession3],
        ]),
      );

      mockSession1.getFile.mockResolvedValue(mockFile1);
      mockSession2.getFile.mockResolvedValue(mockFile2);
      mockSession3.getFile.mockResolvedValue(mockFile3);

      const result = await fetchSessionOutcomes(mockRootHandle as any, 'group1', 'individual1', 'evaluation1');

      expect(result).toHaveLength(3);
      // Should be sorted newest first
      expect(result[0].SessionSettings.Session).toBe('2024-01-03');
      expect(result[1].SessionSettings.Session).toBe('2024-01-02');
      expect(result[2].SessionSettings.Session).toBe('2024-01-01');
    });
  });

  // Error handling tests
  describe('error handling', () => {
    it('should handle and log errors in fetchDirectories', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRootHandle.entries.mockRejectedValue(new Error('Access denied'));

      const result = await fetchDirectories(mockRootHandle as any);

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching directories:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle CleanUpString function calls', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('cleaned-group');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.entries.mockReturnValue(createEntriesIterator([]));

      mockedCleanUpString.mockReturnValue('cleaned-group');

      await fetchConditions(mockRootHandle as any, '  messy group  ', '  messy individual  ', '  messy evaluation  ');

      expect(mockedCleanUpString).toHaveBeenCalledWith('  messy group  ');
      expect(mockedCleanUpString).toHaveBeenCalledWith('  messy individual  ');
      expect(mockedCleanUpString).toHaveBeenCalledWith('  messy evaluation  ');
    });
  });
});
