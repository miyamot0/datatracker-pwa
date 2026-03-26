import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import {
  copyDemoData,
  copyDirectory,
  mutateConditions,
  mutateEvaluations,
  mutateGroups,
  mutateIndividuals,
  mutateKeysets,
  mutateKeysetsAll,
  duplicateEvaluationRecord,
  mutateEvaluationsAll,
  mutateSessionOutcomes,
  mutateSessionParams,
  DemoDataFolderName,
} from '../query-mutate';
import { CleanUpString } from '@/lib/strings';
import { DataExampleFiles } from '@/lib/data';
import { createNewKeySet, serializeKeySet } from '@/lib/keyset';
import { v4 as uuidv4 } from 'uuid';
import { KeySet, KeySetExtended } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';
import { GenerateSavedFileName } from '@/lib/writer';
import { EvaluationRecord } from '@/queries/keysets/types/evaluation-record';
import { importExistingKeysets } from '@/queries/keysets/helpers/import-keysets';

// Mock all dependencies
vi.mock('@/lib/strings');
vi.mock('@/lib/data', () => ({
  DataExampleFiles: [],
}));
vi.mock('@/lib/keyset');
vi.mock('uuid');
vi.mock('@/lib/writer');
vi.mock('@/queries/keysets/helpers/import-keysets');

const mockedCleanUpString = vi.mocked(CleanUpString);
const mockedDataExampleFiles = vi.mocked(DataExampleFiles);
const mockedCreateNewKeySet = vi.mocked(createNewKeySet);
const mockedSerializeKeySet = vi.mocked(serializeKeySet);
const mockedUuidv4 = vi.mocked(uuidv4);
const mockedGenerateSavedFileName = vi.mocked(GenerateSavedFileName);
const mockedImportExistingKeysets = vi.mocked(importExistingKeysets);

// Mock FileSystem API interfaces
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
  removeEntry: Mock;
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
    removeEntry: vi.fn().mockResolvedValue(undefined),
  };

  // Set default resolved values to avoid circular dependencies
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

// Helper function to create async iterators for mocking
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

// Helper function to create entries iterator (returns [name, handle] tuples)
function createEntriesIterator(
  entries: Array<[string, MockFileSystemHandle]>,
): AsyncIterableIterator<[string, MockFileSystemHandle]> {
  return createAsyncIterator(entries);
}

// Helper function to create values iterator (returns handles directly)
function createValuesIterator(handles: MockFileSystemHandle[]): AsyncIterableIterator<MockFileSystemHandle> {
  return createAsyncIterator(handles);
}

describe('file-query-mutate-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCleanUpString.mockImplementation((str: string) => str.trim());
  });

  describe('copyDemoData', () => {
    it('should copy demo data successfully when no existing demo folder', async () => {
      const mockHandle = createMockDirectoryHandle();
      const mockDemoFolder = createMockDirectoryHandle(DemoDataFolderName);
      const mockParticipantFolder = createMockDirectoryHandle('participant1');
      const mockSubFolder = createMockDirectoryHandle('subfolder');
      const mockFileHandle = createMockFileHandle('test.json');
      const mockWritable = createMockWritableStream();

      // Mock entries to return no existing demo folder
      mockHandle.entries.mockReturnValue(
        createEntriesIterator([['other-folder', createMockDirectoryHandle('other-folder')]]),
      );

      // Set up the directory chain properly
      mockHandle.getDirectoryHandle.mockResolvedValue(mockDemoFolder);
      mockDemoFolder.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'participant1') return Promise.resolve(mockParticipantFolder);
        throw new Error(`Directory ${name} not found`);
      });
      mockParticipantFolder.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'subfolder') return Promise.resolve(mockSubFolder);
        throw new Error(`Directory ${name} not found`);
      });
      mockSubFolder.getFileHandle.mockResolvedValue(mockFileHandle);
      mockFileHandle.createWritable.mockResolvedValue(mockWritable);

      // Mock DataExampleFiles
      mockedDataExampleFiles.length = 0;
      mockedDataExampleFiles.push({
        path: ['participant1', 'subfolder'],
        filename: 'test.json',
        text: 'test content',
      } as any);

      await copyDemoData(mockHandle as any);

      expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith(DemoDataFolderName, { create: true });
      expect(mockWritable.write).toHaveBeenCalledWith('test content');
      expect(mockWritable.close).toHaveBeenCalled();
    });

    it('should throw error when demo folder already exists', async () => {
      const mockHandle = createMockDirectoryHandle();
      const mockDemoFolder = createMockDirectoryHandle(DemoDataFolderName);

      // Mock entries to return existing demo folder
      mockHandle.entries.mockReturnValue(createEntriesIterator([[DemoDataFolderName, mockDemoFolder]]));

      await expect(copyDemoData(mockHandle as any)).rejects.toThrow(
        `The ${DemoDataFolderName} folder already exists. Delete it if you'd like to re-load example data.`,
      );
    });

    it('should skip .DS_Store files during checking', async () => {
      const mockHandle = createMockDirectoryHandle();
      const mockDemoFolder = createMockDirectoryHandle(DemoDataFolderName);

      // Mock entries to include .DS_Store
      mockHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['.DS_Store', createMockFileHandle('.DS_Store')],
          ['regular-folder', createMockDirectoryHandle('regular-folder')],
        ]),
      );

      mockHandle.getDirectoryHandle.mockResolvedValue(mockDemoFolder);
      mockedDataExampleFiles.length = 0;

      await copyDemoData(mockHandle as any);

      expect(mockHandle.getDirectoryHandle).toHaveBeenCalledWith(DemoDataFolderName, { create: true });
    });
  });

  describe('copyDirectory', () => {
    it('should copy files and directories recursively', async () => {
      const sourceDir = createMockDirectoryHandle('source');
      const targetDir = createMockDirectoryHandle('target');
      const mockFile = createMockFileHandle('test.txt');
      const mockSubDir = createMockDirectoryHandle('subdir');
      const mockTargetFile = createMockFileHandle('test.txt');
      const mockTargetSubDir = createMockDirectoryHandle('subdir');
      const mockFileContent = createMockFile('file content');
      const mockWritable = createMockWritableStream();

      // Mock source directory entries
      sourceDir.entries.mockReturnValue(
        createEntriesIterator([
          ['test.txt', mockFile],
          ['subdir', mockSubDir],
        ]),
      );

      // Mock subdirectory entries (empty)
      mockSubDir.entries.mockReturnValue(createEntriesIterator([]));

      // Mock file operations
      sourceDir.getFileHandle.mockResolvedValue(mockFile);
      targetDir.getFileHandle.mockResolvedValue(mockTargetFile);
      mockFile.getFile.mockResolvedValue(mockFileContent);
      mockTargetFile.createWritable.mockResolvedValue(mockWritable);

      // Mock directory operations
      sourceDir.getDirectoryHandle.mockResolvedValue(mockSubDir);
      targetDir.getDirectoryHandle.mockResolvedValue(mockTargetSubDir);

      await copyDirectory(sourceDir as any, targetDir as any);

      expect(targetDir.getFileHandle).toHaveBeenCalledWith('test.txt', { create: true });
      expect(mockWritable.write).toHaveBeenCalledWith(mockFileContent);
      expect(mockWritable.close).toHaveBeenCalled();
      expect(targetDir.getDirectoryHandle).toHaveBeenCalledWith('subdir', { create: true });
    });

    it('should skip .DS_Store files', async () => {
      const sourceDir = createMockDirectoryHandle('source');
      const targetDir = createMockDirectoryHandle('target');

      sourceDir.entries.mockReturnValue(
        createEntriesIterator([
          ['.DS_Store', createMockFileHandle('.DS_Store')],
          ['regular.txt', createMockFileHandle('regular.txt')],
        ]),
      );

      const mockFile = createMockFileHandle('regular.txt');
      const mockTargetFile = createMockFileHandle('regular.txt');
      const mockFileContent = createMockFile('content');
      const mockWritable = createMockWritableStream();

      sourceDir.getFileHandle.mockResolvedValue(mockFile);
      targetDir.getFileHandle.mockResolvedValue(mockTargetFile);
      mockFile.getFile.mockResolvedValue(mockFileContent);
      mockTargetFile.createWritable.mockResolvedValue(mockWritable);

      await copyDirectory(sourceDir as any, targetDir as any);

      expect(targetDir.getFileHandle).toHaveBeenCalledWith('regular.txt', { create: true });
      expect(targetDir.getFileHandle).not.toHaveBeenCalledWith('.DS_Store', expect.any(Object));
    });
  });

  describe('mutateConditions', () => {
    let mockRootHandle: MockFileSystemDirectoryHandle;
    let mockGroupDir: MockFileSystemDirectoryHandle;
    let mockIndividualDir: MockFileSystemDirectoryHandle;
    let mockEvaluationDir: MockFileSystemDirectoryHandle;

    beforeEach(() => {
      mockRootHandle = createMockDirectoryHandle('root');
      mockGroupDir = createMockDirectoryHandle('group');
      mockIndividualDir = createMockDirectoryHandle('individual');
      mockEvaluationDir = createMockDirectoryHandle('evaluation');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);
    });

    it('should add a new condition', async () => {
      const mockConditionDir = createMockDirectoryHandle('new-condition');

      mockEvaluationDir.entries.mockReturnValue(
        createEntriesIterator([['existing-condition', createMockDirectoryHandle('existing-condition')]]),
      );

      mockEvaluationDir.getDirectoryHandle.mockResolvedValue(mockConditionDir);

      const result = await mutateConditions(
        mockRootHandle as any,
        'group',
        'individual',
        'evaluation',
        'Add',
        'new-condition',
      );

      expect(mockEvaluationDir.getDirectoryHandle).toHaveBeenCalledWith('new-condition', { create: true });
      expect(result).toEqual(['existing-condition', 'new-condition']);
    });

    it('should throw error when adding condition without name', async () => {
      mockEvaluationDir.entries.mockReturnValue(createEntriesIterator([]));

      await expect(mutateConditions(mockRootHandle as any, 'group', 'individual', 'evaluation', 'Add')).rejects.toThrow(
        'Condition name is required for Add action',
      );
    });

    it.skip('should clear empty conditions', async () => {
      const mockCondition1 = createMockDirectoryHandle('condition1');
      const mockCondition2 = createMockDirectoryHandle('condition2');

      mockEvaluationDir.entries.mockReturnValue(
        createEntriesIterator([
          ['condition1', mockCondition1],
          ['condition2', mockCondition2],
        ]),
      );

      // Mock condition1 as empty - return empty async iterable
      const emptyAsyncIterable = {
        async *[Symbol.asyncIterator]() {
          // Empty generator
        },
      };
      mockCondition1.values.mockResolvedValue(emptyAsyncIterable);

      // Mock condition2 as having files - return non-empty async iterable
      const nonEmptyAsyncIterable = {
        async *[Symbol.asyncIterator]() {
          yield createMockFileHandle('session.json');
        },
      };
      mockCondition2.values.mockResolvedValue(nonEmptyAsyncIterable);

      mockEvaluationDir.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'condition1') return Promise.resolve(mockCondition1);
        if (name === 'condition2') return Promise.resolve(mockCondition2);
        throw new Error(`Directory ${name} not found`);
      });

      mockEvaluationDir.removeEntry.mockResolvedValue(undefined);

      const result = await mutateConditions(mockRootHandle as any, 'group', 'individual', 'evaluation', 'Clear');

      expect(mockEvaluationDir.removeEntry).toHaveBeenCalledWith('condition1', { recursive: true });
      expect(result).toEqual(['condition2']);
    });
  });

  describe('mutateEvaluations', () => {
    let mockRootHandle: MockFileSystemDirectoryHandle;
    let mockGroupDir: MockFileSystemDirectoryHandle;
    let mockIndividualDir: MockFileSystemDirectoryHandle;

    beforeEach(() => {
      mockRootHandle = createMockDirectoryHandle('root');
      mockGroupDir = createMockDirectoryHandle('group');
      mockIndividualDir = createMockDirectoryHandle('individual');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);

      mockIndividualDir.entries.mockReturnValue(
        createEntriesIterator([['existing-eval', createMockDirectoryHandle('existing-eval')]]),
      );
    });

    it('should add a new evaluation', async () => {
      const mockNewEvalDir = createMockDirectoryHandle('new-eval');
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockNewEvalDir);

      const result = await mutateEvaluations(mockRootHandle as any, 'group', 'individual', ['new-eval'], 'Add');

      expect(mockIndividualDir.getDirectoryHandle).toHaveBeenCalledWith('new-eval', { create: true });
      expect(result).toEqual(['existing-eval', 'new-eval']);
    });

    it('should delete evaluations', async () => {
      const result = await mutateEvaluations(mockRootHandle as any, 'group', 'individual', ['existing-eval'], 'Delete');

      expect(mockIndividualDir.removeEntry).toHaveBeenCalledWith('existing-eval', { recursive: true });
      expect(result).toEqual([]);
    });

    it('should duplicate an evaluation', async () => {
      const mockSourceDir = createMockDirectoryHandle('source-eval');
      const mockTargetDir = createMockDirectoryHandle('target-eval');

      mockIndividualDir.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'source-eval') return Promise.resolve(mockSourceDir);
        if (name === 'target-eval') return Promise.resolve(mockTargetDir);
        throw new Error('Not found');
      });

      // Mock copyDirectory by setting up empty entries
      mockSourceDir.entries.mockReturnValue(createEntriesIterator([]));

      const result = await mutateEvaluations(
        mockRootHandle as any,
        'group',
        'individual',
        ['source-eval'],
        'Duplicate',
        'target-eval',
      );

      expect(mockIndividualDir.getDirectoryHandle).toHaveBeenCalledWith('source-eval');
      expect(mockIndividualDir.getDirectoryHandle).toHaveBeenCalledWith('target-eval', { create: true });
      expect(result).toEqual(['existing-eval', 'target-eval']);
    });

    it('should throw error when duplicating without renameTo', async () => {
      await expect(
        mutateEvaluations(mockRootHandle as any, 'group', 'individual', ['source-eval'], 'Duplicate'),
      ).rejects.toThrow('renameTo is required for Duplicate action');
    });

    it('should rename an evaluation', async () => {
      const mockSourceDir = createMockDirectoryHandle('old-name');
      const mockTargetDir = createMockDirectoryHandle('new-name');

      mockIndividualDir.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'old-name') return Promise.resolve(mockSourceDir);
        if (name === 'new-name') return Promise.resolve(mockTargetDir);
        throw new Error('Not found');
      });

      // Mock copyDirectory
      mockSourceDir.entries.mockReturnValue(createEntriesIterator([]));

      // Update entries to include the evaluation to rename
      mockIndividualDir.entries.mockReturnValue(createEntriesIterator([['old-name', mockSourceDir]]));

      const result = await mutateEvaluations(
        mockRootHandle as any,
        'group',
        'individual',
        ['old-name'],
        'Rename',
        'new-name',
      );

      expect(mockIndividualDir.removeEntry).toHaveBeenCalledWith('old-name', { recursive: true });
      expect(result).toEqual(['new-name']);
    });

    it('should throw error when renaming without renameTo', async () => {
      await expect(
        mutateEvaluations(mockRootHandle as any, 'group', 'individual', ['old-name'], 'Rename'),
      ).rejects.toThrow('renameTo is required for Rename action');
    });
  });

  describe('mutateGroups', () => {
    let mockRootHandle: MockFileSystemDirectoryHandle;

    beforeEach(() => {
      mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([['existing-group', createMockDirectoryHandle('existing-group')]]),
      );
    });

    it('should add a new group', async () => {
      const mockNewGroup = createMockDirectoryHandle('new-group');
      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockNewGroup);

      const result = await mutateGroups(mockRootHandle as any, ['new-group'], 'Add');

      expect(mockRootHandle.getDirectoryHandle).toHaveBeenCalledWith('new-group', { create: true });
      expect(result).toEqual(['existing-group', 'new-group']);
    });

    it('should delete a group', async () => {
      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([['group-to-delete', createMockDirectoryHandle('group-to-delete')]]),
      );

      const result = await mutateGroups(mockRootHandle as any, ['group-to-delete'], 'Delete');

      expect(mockRootHandle.removeEntry).toHaveBeenCalledWith('group-to-delete', { recursive: true });
      expect(result).toEqual([]);
    });

    it('should add demo data', async () => {
      // Mock the demo data copying to succeed
      mockRootHandle.getDirectoryHandle.mockResolvedValue(createMockDirectoryHandle(DemoDataFolderName));
      mockedDataExampleFiles.length = 0;

      const result = await mutateGroups(mockRootHandle as any, [], 'Demo');

      expect(result).toEqual(['existing-group', DemoDataFolderName]);
    });

    it('should skip .DS_Store when listing groups', async () => {
      mockRootHandle.entries.mockReturnValue(
        createEntriesIterator([
          ['.DS_Store', createMockFileHandle('.DS_Store')],
          ['regular-group', createMockDirectoryHandle('regular-group')],
        ]),
      );

      const mockNewGroup = createMockDirectoryHandle('new-group');
      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockNewGroup);

      const result = await mutateGroups(mockRootHandle as any, ['new-group'], 'Add');

      expect(result).toEqual(['regular-group', 'new-group']);
    });
  });

  describe('mutateIndividuals', () => {
    let mockRootHandle: MockFileSystemDirectoryHandle;
    let mockGroupDir: MockFileSystemDirectoryHandle;

    beforeEach(() => {
      mockRootHandle = createMockDirectoryHandle('root');
      mockGroupDir = createMockDirectoryHandle('group');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.entries.mockReturnValue(
        createEntriesIterator([['existing-individual', createMockDirectoryHandle('existing-individual')]]),
      );
    });

    it('should add a new individual', async () => {
      const mockNewIndividual = createMockDirectoryHandle('new-individual');
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockNewIndividual);

      const result = await mutateIndividuals(mockRootHandle as any, 'group', ['new-individual'], 'Add');

      expect(mockGroupDir.getDirectoryHandle).toHaveBeenCalledWith('new-individual', { create: true });
      expect(result).toEqual(['existing-individual', 'new-individual']);
    });

    it('should delete individuals', async () => {
      mockGroupDir.entries.mockReturnValue(
        createEntriesIterator([
          ['individual-to-delete', createMockDirectoryHandle('individual-to-delete')],
          ['keep-this-individual', createMockDirectoryHandle('keep-this-individual')],
        ]),
      );

      const result = await mutateIndividuals(mockRootHandle as any, 'group', ['individual-to-delete'], 'Delete');

      expect(mockGroupDir.removeEntry).toHaveBeenCalledWith('individual-to-delete', { recursive: true });
      expect(result).toEqual(['keep-this-individual']);
    });

    it('should delete multiple individuals', async () => {
      mockGroupDir.entries.mockReturnValue(
        createEntriesIterator([
          ['individual1', createMockDirectoryHandle('individual1')],
          ['individual2', createMockDirectoryHandle('individual2')],
          ['keep-this', createMockDirectoryHandle('keep-this')],
        ]),
      );

      const result = await mutateIndividuals(mockRootHandle as any, 'group', ['individual1', 'individual2'], 'Delete');

      expect(mockGroupDir.removeEntry).toHaveBeenCalledWith('individual1', { recursive: true });
      expect(mockGroupDir.removeEntry).toHaveBeenCalledWith('individual2', { recursive: true });
      expect(result).toEqual(['keep-this']);
    });
  });

  describe('mutateKeysets', () => {
    let mockRootHandle: MockFileSystemDirectoryHandle;
    let mockGroupDir: MockFileSystemDirectoryHandle;
    let mockIndividualDir: MockFileSystemDirectoryHandle;

    beforeEach(() => {
      mockRootHandle = createMockDirectoryHandle('root');
      mockGroupDir = createMockDirectoryHandle('group');
      mockIndividualDir = createMockDirectoryHandle('individual');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);

      // Mock existing keysets - Setup default empty entries, individual tests will override
      mockIndividualDir.entries.mockReturnValue(createEntriesIterator([]));
    });

    it('should add a new keyset', async () => {
      // Mock existing keyset
      const mockExistingKeysetFile = createMockFileHandle('existing-keyset.json');
      const mockExistingFile = createMockFile('{"Name": "existing-keyset", "id": "123"}');
      mockExistingKeysetFile.getFile.mockResolvedValue(mockExistingFile);

      mockIndividualDir.entries.mockReturnValue(
        createEntriesIterator([['existing-keyset.json', mockExistingKeysetFile]]),
      );

      // Ensure getFileHandle returns the same mocked file handle
      mockIndividualDir.getFileHandle.mockImplementation((name) => {
        if (name === 'existing-keyset.json') return Promise.resolve(mockExistingKeysetFile);
        if (name === 'new-keyset.json') {
          const newMockFile = createMockFileHandle('new-keyset.json');
          const newMockWritable = createMockWritableStream();
          newMockFile.createWritable.mockResolvedValue(newMockWritable);
          return Promise.resolve(newMockFile);
        }
        throw new Error(`File ${name} not found`);
      });
      const mockNewKeyset = { Name: 'new-keyset', id: '456' } as KeySet;
      const mockSerializedKeyset = '{"Name": "new-keyset", "id": "456"}';

      mockedCreateNewKeySet.mockReturnValue(mockNewKeyset);
      mockedSerializeKeySet.mockReturnValue(mockSerializedKeyset);

      const result = await mutateKeysets(mockRootHandle as any, 'group', 'individual', ['new-keyset'], 'Add');

      expect(mockedCreateNewKeySet).toHaveBeenCalledWith('new-keyset');
      expect(mockIndividualDir.getFileHandle).toHaveBeenCalledWith('new-keyset.json', { create: true });
      expect(result).toHaveLength(2); // existing + new
      expect(result).toContainEqual(mockNewKeyset);
    });

    it('should delete keysets', async () => {
      // Mock existing keyset
      const mockExistingKeysetFile = createMockFileHandle('existing-keyset.json');
      const mockExistingFile = createMockFile('{"Name": "existing-keyset", "id": "123"}');
      mockExistingKeysetFile.getFile.mockResolvedValue(mockExistingFile);

      mockIndividualDir.entries.mockReturnValue(
        createEntriesIterator([['existing-keyset.json', mockExistingKeysetFile]]),
      );

      // Ensure getFileHandle returns the same mocked file handle
      mockIndividualDir.getFileHandle.mockImplementation((name) => {
        if (name === 'existing-keyset.json') return Promise.resolve(mockExistingKeysetFile);
        throw new Error(`File ${name} not found`);
      });

      const result = await mutateKeysets(mockRootHandle as any, 'group', 'individual', ['existing-keyset'], 'Delete');

      expect(mockIndividualDir.removeEntry).toHaveBeenCalledWith('existing-keyset.json');
      expect(result).toEqual([]);
    });

    it('should handle delete error gracefully', async () => {
      // Set up empty entries first to avoid reading non-existent files
      mockIndividualDir.entries.mockReturnValue(createEntriesIterator([]));

      mockIndividualDir.getFileHandle.mockRejectedValue(new Error('File not found'));

      await expect(
        mutateKeysets(mockRootHandle as any, 'group', 'individual', ['nonexistent-keyset'], 'Delete'),
      ).rejects.toThrow('Failed to remove keyboard: nonexistent-keyset.json');
    });

    it('should duplicate a keyset', async () => {
      const mockExistingKeyset = { Name: 'existing-keyset', id: '123' } as KeySet;
      const mockDuplicatedKeyset = {
        ...mockExistingKeyset,
        Name: 'duplicated-keyset',
        id: '789',
        createdAt: new Date(),
        lastModified: new Date(),
      };
      const mockFileHandle = createMockFileHandle('duplicated-keyset.json');
      const mockWritable = createMockWritableStream();

      // Setup existing keysets
      const mockExistingKeysetFile = createMockFileHandle('existing-keyset.json');
      const mockExistingFileContent = createMockFile('{"Name": "existing-keyset", "id": "123"}');
      mockExistingKeysetFile.getFile.mockResolvedValue(mockExistingFileContent);

      mockIndividualDir.entries.mockReturnValue(
        createEntriesIterator([['existing-keyset.json', mockExistingKeysetFile]]),
      );

      // Mock getFileHandle for both existing and new files
      mockIndividualDir.getFileHandle.mockImplementation((name) => {
        if (name === 'existing-keyset.json') return Promise.resolve(mockExistingKeysetFile);
        if (name === 'duplicated-keyset.json') {
          const newMockFile = createMockFileHandle('duplicated-keyset.json');
          newMockFile.createWritable.mockResolvedValue(mockWritable);
          return Promise.resolve(newMockFile);
        }
        throw new Error('Not found');
      });

      mockedUuidv4.mockReturnValue('789');
      mockedSerializeKeySet.mockReturnValue(JSON.stringify(mockDuplicatedKeyset));
      mockFileHandle.createWritable.mockResolvedValue(mockWritable);

      const result = await mutateKeysets(
        mockRootHandle as any,
        'group',
        'individual',
        ['existing-keyset'],
        'Duplicate',
        'duplicated-keyset',
      );

      expect(mockIndividualDir.getFileHandle).toHaveBeenCalledWith('duplicated-keyset.json', { create: true });
      expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(mockDuplicatedKeyset));
      expect(result).toHaveLength(2);
    });

    it('should throw error when duplicating without matching keyset', async () => {
      mockIndividualDir.entries.mockReturnValue(createEntriesIterator([]));

      await expect(
        mutateKeysets(mockRootHandle as any, 'group', 'individual', ['nonexistent-keyset'], 'Duplicate', 'new-name'),
      ).rejects.toThrow('No matching KeySet found.');
    });

    it('should throw error when duplicating without renameTo', async () => {
      // Mock existing keyset
      const mockExistingKeysetFile = createMockFileHandle('existing-keyset.json');
      const mockExistingFile = createMockFile('{"Name": "existing-keyset", "id": "123"}');
      mockExistingKeysetFile.getFile.mockResolvedValue(mockExistingFile);

      mockIndividualDir.entries.mockReturnValue(
        createEntriesIterator([['existing-keyset.json', mockExistingKeysetFile]]),
      );

      // Ensure getFileHandle returns the same mocked file handle
      mockIndividualDir.getFileHandle.mockImplementation((name) => {
        if (name === 'existing-keyset.json') return Promise.resolve(mockExistingKeysetFile);
        throw new Error(`File ${name} not found`);
      });

      await expect(
        mutateKeysets(mockRootHandle as any, 'group', 'individual', ['existing-keyset'], 'Duplicate'),
      ).rejects.toThrow('No renameTo text supplied.');
    });

    it('should update a keyset', async () => {
      // Mock existing keyset
      const mockExistingKeysetFile = createMockFileHandle('existing-keyset.json');
      const mockExistingFile = createMockFile('{"Name": "existing-keyset", "id": "123"}');
      mockExistingKeysetFile.getFile.mockResolvedValue(mockExistingFile);
      const mockWritable = createMockWritableStream();
      mockExistingKeysetFile.createWritable.mockResolvedValue(mockWritable);

      mockIndividualDir.entries.mockReturnValue(
        createEntriesIterator([['existing-keyset.json', mockExistingKeysetFile]]),
      );

      // Ensure getFileHandle returns the same mocked file handle
      mockIndividualDir.getFileHandle.mockImplementation((name) => {
        if (name === 'existing-keyset.json') return Promise.resolve(mockExistingKeysetFile);
        throw new Error(`File ${name} not found`);
      });

      const mockUpdatedKeyset = { Name: 'existing-keyset', id: '123', updated: true } as any;
      mockedSerializeKeySet.mockReturnValue(JSON.stringify(mockUpdatedKeyset));

      const result = await mutateKeysets(
        mockRootHandle as any,
        'group',
        'individual',
        ['existing-keyset'],
        'Update',
        undefined,
        mockUpdatedKeyset,
      );

      expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(mockUpdatedKeyset));
      expect(result[0]).toEqual(mockUpdatedKeyset);
    });

    it('should throw error when updating without newKeySet', async () => {
      // Mock existing keyset
      const mockExistingKeysetFile = createMockFileHandle('existing-keyset.json');
      const mockExistingFile = createMockFile('{"Name": "existing-keyset", "id": "123"}');
      mockExistingKeysetFile.getFile.mockResolvedValue(mockExistingFile);

      mockIndividualDir.entries.mockReturnValue(
        createEntriesIterator([['existing-keyset.json', mockExistingKeysetFile]]),
      );

      // Ensure getFileHandle returns the same mocked file handle
      mockIndividualDir.getFileHandle.mockImplementation((name) => {
        if (name === 'existing-keyset.json') return Promise.resolve(mockExistingKeysetFile);
        throw new Error(`File ${name} not found`);
      });

      await expect(
        mutateKeysets(mockRootHandle as any, 'group', 'individual', ['existing-keyset'], 'Update'),
      ).rejects.toThrow('newKeySet not supplied');
    });

    it('should throw error for rename action (not implemented)', async () => {
      // Mock existing keyset
      const mockExistingKeysetFile = createMockFileHandle('existing-keyset.json');
      const mockExistingFile = createMockFile('{"Name": "existing-keyset", "id": "123"}');
      mockExistingKeysetFile.getFile.mockResolvedValue(mockExistingFile);

      mockIndividualDir.entries.mockReturnValue(
        createEntriesIterator([['existing-keyset.json', mockExistingKeysetFile]]),
      );

      // Ensure getFileHandle returns the same mocked file handle
      mockIndividualDir.getFileHandle.mockImplementation((name) => {
        if (name === 'existing-keyset.json') return Promise.resolve(mockExistingKeysetFile);
        throw new Error(`File ${name} not found`);
      });

      await expect(
        mutateKeysets(mockRootHandle as any, 'group', 'individual', ['existing-keyset'], 'Rename'),
      ).rejects.toThrow('Rename action not yet implemented');
    });

    it('should skip invalid JSON files', async () => {
      const mockValidFile = createMockFileHandle('valid.json');
      const mockInvalidFile = createMockFileHandle('invalid.json');
      const mockValidFileContent = createMockFile('{"Name": "valid", "id": "123"}');
      const mockInvalidFileContent = createMockFile('invalid json');

      mockValidFile.getFile.mockResolvedValue(mockValidFileContent);
      mockInvalidFile.getFile.mockResolvedValue(mockInvalidFileContent);

      mockIndividualDir.entries.mockReturnValue(
        createEntriesIterator([
          ['valid.json', mockValidFile],
          ['invalid.json', mockInvalidFile],
        ]),
      );

      // Mock getFileHandle for getting files and creating new ones
      mockIndividualDir.getFileHandle.mockImplementation((name) => {
        if (name === 'valid.json') return Promise.resolve(mockValidFile);
        if (name === 'invalid.json') return Promise.resolve(mockInvalidFile);
        if (name === 'new-keyset.json') {
          const newMockFile = createMockFileHandle('new-keyset.json');
          const newMockWritable = createMockWritableStream();
          newMockFile.createWritable.mockResolvedValue(newMockWritable);
          return Promise.resolve(newMockFile);
        }
        throw new Error(`File ${name} not found`);
      });

      const result = await mutateKeysets(mockRootHandle as any, 'group', 'individual', ['new-keyset'], 'Add');

      // Should only include the valid keyset plus the new one
      expect(result).toHaveLength(2);
    });
  });

  describe('mutateKeysetsAll', () => {
    it('should import keysets and filter out duplicates', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockKeySets = [
        { Name: 'keyset1', id: '1' },
        { Name: 'keyset2', id: '2' },
      ] as KeySet[];

      const mockAllKeySets = [
        { Name: 'keyset1', id: '1', Individual: 'individual', Group: 'group' },
        { Name: 'keyset3', id: '3', Individual: 'other', Group: 'group' },
        { Name: 'keyset4', id: '4', Individual: 'individual', Group: 'group' },
      ] as KeySetExtended[];

      const mockImportedKeySets = [
        { Name: 'keyset1', id: '1', Individual: 'individual', Group: 'group' },
        { Name: 'keyset2', id: '2', Individual: 'individual', Group: 'group' },
      ] as KeySetExtended[];

      mockedImportExistingKeysets.mockResolvedValue(mockImportedKeySets);

      const result = await mutateKeysetsAll(mockRootHandle as any, 'group', 'individual', mockKeySets, mockAllKeySets);

      expect(mockedImportExistingKeysets).toHaveBeenCalledWith(mockRootHandle, 'group', 'individual', mockKeySets);

      // Should exclude keysets belonging to 'individual' and those with matching names
      expect(result).toEqual([{ Name: 'keyset3', id: '3', Individual: 'other', Group: 'group' }]);
    });
  });

  describe('duplicateEvaluationRecord', () => {
    it('should create duplicate evaluation with conditions', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group');
      const mockIndividualDir = createMockDirectoryHandle('individual');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation');
      const mockConditionDir1 = createMockDirectoryHandle('condition1');
      const mockConditionDir2 = createMockDirectoryHandle('condition2');

      const mockEvaluation = {
        Group: 'source-group',
        Individual: 'source-individual',
        Evaluation: 'evaluation',
        Conditions: ['condition1', 'condition2'],
      } as EvaluationRecord;

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);
      mockEvaluationDir.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'condition1') return Promise.resolve(mockConditionDir1);
        if (name === 'condition2') return Promise.resolve(mockConditionDir2);
        throw new Error('Not found');
      });

      const result = await duplicateEvaluationRecord(
        mockRootHandle as any,
        'target-group',
        'target-individual',
        mockEvaluation,
      );

      expect(mockRootHandle.getDirectoryHandle).toHaveBeenCalledWith('target-group');
      expect(mockGroupDir.getDirectoryHandle).toHaveBeenCalledWith('target-individual');
      expect(mockIndividualDir.getDirectoryHandle).toHaveBeenCalledWith('evaluation', { create: true });
      expect(mockEvaluationDir.getDirectoryHandle).toHaveBeenCalledWith('condition1', { create: true });
      expect(mockEvaluationDir.getDirectoryHandle).toHaveBeenCalledWith('condition2', { create: true });

      expect(result).toEqual({
        Group: 'target-group',
        Individual: 'target-individual',
        Evaluation: 'evaluation',
        Conditions: ['condition1', 'condition2'],
      });
    });
  });

  describe('mutateEvaluationsAll', () => {
    it('should import evaluations successfully', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockAllRecords = [
        { Group: 'group1', Individual: 'ind1', Evaluation: 'eval1', Conditions: [] },
      ] as EvaluationRecord[];

      const mockRelevantRecords = [
        { Group: 'group2', Individual: 'ind2', Evaluation: 'eval2', Conditions: ['condition1'] },
      ] as EvaluationRecord[];

      const mockDuplicatedRecord = {
        Group: 'target-group',
        Individual: 'target-individual',
        Evaluation: 'eval2',
        Conditions: ['condition1'],
      } as EvaluationRecord;

      // Mock the duplicateEvaluationRecord function behavior
      const mockGroupDir = createMockDirectoryHandle('target-group');
      const mockIndividualDir = createMockDirectoryHandle('target-individual');
      const mockEvaluationDir = createMockDirectoryHandle('eval2');
      const mockConditionDir = createMockDirectoryHandle('condition1');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);
      mockEvaluationDir.getDirectoryHandle.mockResolvedValue(mockConditionDir);

      const result = await mutateEvaluationsAll(
        mockRootHandle as any,
        'target-group',
        'target-individual',
        'Import',
        mockAllRecords,
        mockRelevantRecords,
      );

      expect(result).toHaveLength(2); // original + imported
      expect(result).toContainEqual(mockAllRecords[0]);
      expect(result[1]).toEqual(mockDuplicatedRecord);
    });

    it('should handle empty relevant records', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockAllRecords = [
        { Group: 'group1', Individual: 'ind1', Evaluation: 'eval1', Conditions: [] },
      ] as EvaluationRecord[];

      const result = await mutateEvaluationsAll(
        mockRootHandle as any,
        'target-group',
        'target-individual',
        'Import',
        mockAllRecords,
        [],
      );

      expect(result).toEqual(mockAllRecords);
    });
  });

  describe('mutateSessionOutcomes', () => {
    let mockRootHandle: MockFileSystemDirectoryHandle;
    let mockGroupDir: MockFileSystemDirectoryHandle;
    let mockIndividualDir: MockFileSystemDirectoryHandle;
    let mockEvaluationDir: MockFileSystemDirectoryHandle;

    beforeEach(() => {
      mockRootHandle = createMockDirectoryHandle('root');
      mockGroupDir = createMockDirectoryHandle('group');
      mockIndividualDir = createMockDirectoryHandle('individual');
      mockEvaluationDir = createMockDirectoryHandle('evaluation');

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);

      mockedGenerateSavedFileName.mockReturnValue('generated-filename.json');
    });

    it('should delete session outcomes', async () => {
      const mockConditionDir = createMockDirectoryHandle('condition1');
      const mockOutcomes = [
        { Filename: 'session1.json', SessionSettings: { Condition: 'condition1' } },
      ] as ModifiedSessionResult[];

      const mockSessionOutcomes = [...mockOutcomes];

      // Create a proper promise mock
      const mockPromise = Promise.resolve(mockConditionDir);
      mockEvaluationDir.getDirectoryHandle.mockReturnValue(mockPromise);

      const result = await mutateSessionOutcomes(
        mockRootHandle as any,
        'group',
        'individual',
        'evaluation',
        mockOutcomes,
        mockSessionOutcomes,
        'Delete',
      );

      expect(mockConditionDir.removeEntry).toHaveBeenCalledWith('session1.json');
      expect(result).toEqual([]);
    });

    it('should handle delete when condition directory not found', async () => {
      const mockOutcomes = [
        { Filename: 'session1.json', SessionSettings: { Condition: 'nonexistent' } },
      ] as ModifiedSessionResult[];

      // Create a rejected promise that properly handles .catch()
      const mockRejectedPromise = Promise.reject(new Error('Not found'));
      mockEvaluationDir.getDirectoryHandle.mockReturnValue(mockRejectedPromise);

      const result = await mutateSessionOutcomes(
        mockRootHandle as any,
        'group',
        'individual',
        'evaluation',
        mockOutcomes,
        mockOutcomes,
        'Delete',
      );

      // Should still return the original outcomes since deletion failed gracefully
      expect(result).toEqual(mockOutcomes);
    });

    it('should edit condition for session outcomes', async () => {
      const mockOldConditionDir = createMockDirectoryHandle('old-condition');
      const mockNewConditionDir = createMockDirectoryHandle('new-condition');
      const mockFileHandle = createMockFileHandle('session1.json');
      const mockNewFileHandle = createMockFileHandle('generated-filename.json');
      const mockWritable = createMockWritableStream();

      const mockOutcomes = [
        {
          Filename: 'session1.json',
          SessionSettings: { Condition: 'old-condition', Session: '2024-01-01' },
        },
      ] as unknown as ModifiedSessionResult[];

      mockEvaluationDir.values.mockReturnValue(createValuesIterator([mockOldConditionDir]));
      mockOldConditionDir.values.mockReturnValue(createValuesIterator([mockFileHandle]));

      mockEvaluationDir.getDirectoryHandle.mockImplementation((name) => {
        if (name === 'new-condition') return Promise.resolve(mockNewConditionDir);
        if (name === 'old-condition') return Promise.resolve(mockOldConditionDir);
        throw new Error('Not found');
      });

      mockNewConditionDir.getFileHandle.mockResolvedValue(mockNewFileHandle);
      mockNewFileHandle.createWritable.mockResolvedValue(mockWritable);

      const result = await mutateSessionOutcomes(
        mockRootHandle as any,
        'group',
        'individual',
        'evaluation',
        mockOutcomes,
        mockOutcomes,
        'EditCondition',
        'new-condition',
      );

      expect(mockNewConditionDir.getFileHandle).toHaveBeenCalledWith('generated-filename.json', { create: true });
      expect(mockWritable.write).toHaveBeenCalled();
      expect(mockOldConditionDir.removeEntry).toHaveBeenCalledWith('session1.json');
      expect(result[0].SessionSettings.Condition).toBe('new-condition');
    });

    it('should throw error when editing condition without rename value', async () => {
      const mockOutcomes = [] as ModifiedSessionResult[];

      await expect(
        mutateSessionOutcomes(
          mockRootHandle as any,
          'group',
          'individual',
          'evaluation',
          mockOutcomes,
          mockOutcomes,
          'EditCondition',
        ),
      ).rejects.toThrow('Condition rename value not provided');
    });

    it('should modify session outcomes', async () => {
      const mockConditionDir = createMockDirectoryHandle('condition1');
      const mockFileHandle = createMockFileHandle('session1.json');
      const mockWritable = createMockWritableStream();

      const mockPriorOutcome = {
        Filename: 'session1.json',
        SessionSettings: { Condition: 'condition1' },
        data: 'old',
      } as any;

      const mockUpdatedOutcome = {
        Filename: 'session1.json',
        SessionSettings: { Condition: 'condition1' },
        data: 'new',
      } as any;

      const mockSessionOutcomes = [mockPriorOutcome];

      mockEvaluationDir.getDirectoryHandle.mockResolvedValue(mockConditionDir);
      mockConditionDir.getFileHandle.mockResolvedValue(mockFileHandle);
      mockFileHandle.createWritable.mockResolvedValue(mockWritable);

      const result = await mutateSessionOutcomes(
        mockRootHandle as any,
        'group',
        'individual',
        'evaluation',
        [],
        mockSessionOutcomes,
        'Modify',
        undefined,
        mockUpdatedOutcome,
        mockPriorOutcome,
      );

      expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(mockUpdatedOutcome));
      expect(result[0]).toEqual(mockUpdatedOutcome);
    });

    it('should throw error when modifying without required parameters', async () => {
      await expect(
        mutateSessionOutcomes(mockRootHandle as any, 'group', 'individual', 'evaluation', [], [], 'Modify'),
      ).rejects.toThrow('Updated outcome not found');
    });

    it('should throw error when prior outcome not found in list', async () => {
      const mockUpdatedOutcome = { Filename: 'test.json' } as any;
      const mockPriorOutcome = { Filename: 'test.json' } as any;
      const mockSessionOutcomes = [{ Filename: 'other.json' } as any];

      await expect(
        mutateSessionOutcomes(
          mockRootHandle as any,
          'group',
          'individual',
          'evaluation',
          [],
          mockSessionOutcomes,
          'Modify',
          undefined,
          mockUpdatedOutcome,
          mockPriorOutcome,
        ),
      ).rejects.toThrow('Original outcome not found');
    });

    it('should add new session outcome', async () => {
      const mockConditionDir = createMockDirectoryHandle('condition1');
      const mockFileHandle = createMockFileHandle('generated-filename.json');
      const mockWritable = createMockWritableStream();

      const mockNewOutcome = {
        SessionSettings: { Condition: 'condition1', Session: '2024-01-01' },
        data: 'test',
      } as any;

      const mockSessionOutcomes = [] as ModifiedSessionResult[];

      mockEvaluationDir.getDirectoryHandle.mockResolvedValue(mockConditionDir);
      mockConditionDir.getFileHandle.mockResolvedValue(mockFileHandle);
      mockFileHandle.createWritable.mockResolvedValue(mockWritable);

      const result = await mutateSessionOutcomes(
        mockRootHandle as any,
        'group',
        'individual',
        'evaluation',
        [],
        mockSessionOutcomes,
        'Add',
        undefined,
        undefined,
        undefined,
        mockNewOutcome,
      );

      expect(mockConditionDir.getFileHandle).toHaveBeenCalledWith('generated-filename.json', { create: true });
      expect(mockWritable.write).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].Filename).toBe('generated-filename.json');
    });

    it('should throw error when adding without new outcome', async () => {
      await expect(
        mutateSessionOutcomes(mockRootHandle as any, 'group', 'individual', 'evaluation', [], [], 'Add'),
      ).rejects.toThrow('New outcome not found');
    });
  });

  describe('mutateSessionParams', () => {
    it('should update session parameters successfully', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockGroupDir = createMockDirectoryHandle('group');
      const mockIndividualDir = createMockDirectoryHandle('individual');
      const mockEvaluationDir = createMockDirectoryHandle('evaluation');
      const mockSettingsFile = createMockFileHandle('settings.json');
      const mockWritable = createMockWritableStream();

      const mockSettings = { setting1: 'value1', setting2: 'value2' } as any;

      mockRootHandle.getDirectoryHandle.mockResolvedValue(mockGroupDir);
      mockGroupDir.getDirectoryHandle.mockResolvedValue(mockIndividualDir);
      mockIndividualDir.getDirectoryHandle.mockResolvedValue(mockEvaluationDir);
      mockEvaluationDir.getFileHandle.mockResolvedValue(mockSettingsFile);
      mockSettingsFile.createWritable.mockResolvedValue(mockWritable);

      const result = await mutateSessionParams(
        mockRootHandle as any,
        'group',
        'individual',
        'evaluation',
        mockSettings,
      );

      expect(mockEvaluationDir.getFileHandle).toHaveBeenCalledWith('settings.json', { create: true });
      expect(mockWritable.write).toHaveBeenCalledWith(JSON.stringify(mockSettings));
      expect(mockWritable.close).toHaveBeenCalled();
      expect(result).toEqual(mockSettings);
    });

    it('should handle file system errors', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockSettings = {} as any;

      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Directory not found'));

      await expect(
        mutateSessionParams(mockRootHandle as any, 'group', 'individual', 'evaluation', mockSettings),
      ).rejects.toThrow();
    });
  });

  // Error handling tests
  describe('error handling', () => {
    it('should handle and rethrow errors in mutateConditions', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Directory access failed'));

      await expect(
        mutateConditions(mockRootHandle as any, 'group', 'individual', 'evaluation', 'Add', 'condition'),
      ).rejects.toThrow('Directory access failed');
    });

    it('should handle and rethrow errors in mutateEvaluations', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Access denied'));

      await expect(mutateEvaluations(mockRootHandle as any, 'group', 'individual', ['eval'], 'Add')).rejects.toThrow(
        'Access denied',
      );
    });

    it('should handle and rethrow errors in mutateGroups', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.entries.mockImplementation(() => {
        throw new Error('Cannot list entries');
      });

      await expect(mutateGroups(mockRootHandle as any, ['group'], 'Add')).rejects.toThrow('Cannot list entries');
    });

    it('should handle and rethrow errors in mutateIndividuals', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Group not found'));

      await expect(mutateIndividuals(mockRootHandle as any, 'group', ['individual'], 'Add')).rejects.toThrow(
        'Group not found',
      );
    });

    it('should handle and rethrow errors in mutateKeysets', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Permission denied'));

      await expect(mutateKeysets(mockRootHandle as any, 'group', 'individual', ['keyset'], 'Add')).rejects.toThrow(
        'Permission denied',
      );
    });

    it('should handle and rethrow errors in duplicateEvaluationRecord', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockEvaluation = {
        Group: 'group',
        Individual: 'individual',
        Evaluation: 'evaluation',
        Conditions: [],
      } as EvaluationRecord;

      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Handle error'));

      await expect(
        duplicateEvaluationRecord(mockRootHandle as any, 'group', 'individual', mockEvaluation),
      ).rejects.toThrow('Handle error');
    });

    it('should handle and rethrow errors in mutateSessionOutcomes', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Directory error'));

      await expect(
        mutateSessionOutcomes(mockRootHandle as any, 'group', 'individual', 'evaluation', [], [], 'Delete'),
      ).rejects.toThrow('Directory error');
    });

    it('should handle and rethrow errors in mutateSessionParams', async () => {
      const mockRootHandle = createMockDirectoryHandle('root');
      const mockSettings = {} as any;
      mockRootHandle.getDirectoryHandle.mockRejectedValue(new Error('Settings error'));

      await expect(
        mutateSessionParams(mockRootHandle as any, 'group', 'individual', 'evaluation', mockSettings),
      ).rejects.toThrow('Settings error');
    });
  });
});
