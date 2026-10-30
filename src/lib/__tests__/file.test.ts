import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileAsync, getFileHandle, writeOutFileToRemote, syncAllFiles } from '../file';
import type { SyncEntryTableRow } from '@/types/sync';

describe('file.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readFileAsync', () => {
    it('should be a function that takes a File parameter', () => {
      expect(typeof readFileAsync).toBe('function');
      expect(readFileAsync.length).toBe(1); // Should take 1 parameter

      // Test that it returns a Promise
      const mockFile = new File(['test'], 'test.txt');
      const result = readFileAsync(mockFile);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('getFileHandle', () => {
    it('should return undefined for undefined handle', async () => {
      const result = await getFileHandle(undefined as any, 'test.txt');
      expect(result).toBeUndefined();
    });

    it('should throw error for empty path after filtering', async () => {
      const mockHandle = {} as FileSystemDirectoryHandle;
      await expect(getFileHandle(mockHandle, '')).rejects.toThrow('Invalid Path');
      await expect(getFileHandle(mockHandle, '   ')).rejects.toThrow('Invalid Path');
      await expect(getFileHandle(mockHandle, '///')).rejects.toThrow('Invalid Path');
    });
  });

  describe('writeOutFileToRemote', () => {
    it('should handle undefined remote directory', async () => {
      const mockHandle = {} as FileSystemDirectoryHandle;
      const mockEntry: SyncEntryTableRow = {
        file: 'test.txt',
        direction: 'to_remote',
        status: 'pending',
      };

      // Should not throw when remote directory is undefined
      await expect(writeOutFileToRemote(undefined as any, mockHandle, mockEntry)).resolves.not.toThrow();
    });

    it('should handle undefined local handle', async () => {
      const mockRemote = {} as FileSystemDirectoryHandle;
      const mockEntry: SyncEntryTableRow = {
        file: 'test.txt',
        direction: 'to_remote',
        status: 'pending',
      };

      // Should not throw when local handle is undefined
      await expect(writeOutFileToRemote(mockRemote, undefined as any, mockEntry)).resolves.not.toThrow();
    });

    it('should handle empty file path', async () => {
      const mockRemote = {} as FileSystemDirectoryHandle;
      const mockHandle = {} as FileSystemDirectoryHandle;
      const mockEntry: SyncEntryTableRow = {
        file: '',
        direction: 'to_remote',
        status: 'pending',
      };

      // Should not throw when file path is empty
      await expect(writeOutFileToRemote(mockRemote, mockHandle, mockEntry)).resolves.not.toThrow();
    });
  });

  describe('syncAllFiles', () => {
    it('should handle empty array of files', async () => {
      const mockLocal = {} as FileSystemDirectoryHandle;
      const mockRemote = {} as FileSystemDirectoryHandle;
      const mockCallback = vi.fn();

      await syncAllFiles([], mockLocal, mockRemote, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(expect.any(Function));

      // Test the callback function
      const callbackFn = mockCallback.mock.calls[0][0];
      const result = callbackFn(['existing.txt']);
      expect(result).toEqual(['existing.txt']);
    });

    it('should handle callback with null previous state', async () => {
      const mockLocal = {} as FileSystemDirectoryHandle;
      const mockRemote = {} as FileSystemDirectoryHandle;
      const mockCallback = vi.fn();

      await syncAllFiles([], mockLocal, mockRemote, mockCallback);

      const callbackFn = mockCallback.mock.calls[0][0];

      // Test with null
      expect(callbackFn(null)).toEqual([]);

      // Test with undefined
      expect(callbackFn(undefined)).toEqual([]);
    });

    it('should preserve files from previous state', async () => {
      const mockLocal = {} as FileSystemDirectoryHandle;
      const mockRemote = {} as FileSystemDirectoryHandle;
      const mockCallback = vi.fn();

      await syncAllFiles([], mockLocal, mockRemote, mockCallback);

      const callbackFn = mockCallback.mock.calls[0][0];
      const result = callbackFn(['file1.txt', 'file2.txt']);
      expect(result).toEqual(['file1.txt', 'file2.txt']);
    });
  });

  describe('Edge cases and validations', () => {
    it('should properly split file paths', () => {
      const testPath = 'subdir/file.txt';
      const pathParts = testPath.split('/').filter((part) => part.length > 0);

      expect(pathParts).toEqual(['subdir', 'file.txt']);
      expect(pathParts.length).toBe(2);
    });

    it('should handle paths with multiple slashes', () => {
      const edgePath = '//subdir//file.txt//';
      const pathParts = edgePath.split('/').filter((part) => part.length > 0);

      expect(pathParts).toEqual(['subdir', 'file.txt']);
    });

    it('should validate SyncEntryTableRow structure', () => {
      const entry: SyncEntryTableRow = {
        file: 'test.txt',
        direction: 'to_remote',
        status: 'pending',
      };

      expect(entry).toHaveProperty('file');
      expect(entry).toHaveProperty('direction');
      expect(entry).toHaveProperty('status');
      expect(typeof entry.file).toBe('string');
      expect(typeof entry.direction).toBe('string');
      expect(typeof entry.status).toBe('string');
    });

    it('should test function exports', () => {
      expect(typeof readFileAsync).toBe('function');
      expect(typeof getFileHandle).toBe('function');
      expect(typeof writeOutFileToRemote).toBe('function');
      expect(typeof syncAllFiles).toBe('function');
    });
  });
});

type MemoryNode = { kind: 'dir'; entries: Map<string, MemoryNode> } | { kind: 'file'; text: string };

/** In-memory directory tree implementing the File System Access calls used by file.ts */
function memoryDir(entries: Map<string, MemoryNode> = new Map()): FileSystemDirectoryHandle {
  return {
    async getDirectoryHandle(name: string, options?: { create?: boolean }) {
      let node = entries.get(name);
      if (!node) {
        if (!options?.create) throw new DOMException('missing', 'NotFoundError');
        node = { kind: 'dir', entries: new Map() };
        entries.set(name, node);
      }
      if (node.kind !== 'dir') throw new TypeError(`${name} is not a directory`);
      return memoryDir(node.entries);
    },
    async getFileHandle(name: string, options?: { create?: boolean }) {
      let node = entries.get(name);
      if (!node) {
        if (!options?.create) throw new DOMException('missing', 'NotFoundError');
        node = { kind: 'file', text: '' };
        entries.set(name, node);
      }
      if (node.kind !== 'file') throw new TypeError(`${name} is not a file`);
      const fileNode = node;
      return {
        async getFile() {
          return new File([fileNode.text], name);
        },
        async createWritable() {
          return {
            async write(data: Blob) {
              fileNode.text = await data.text();
            },
            async close() {},
          };
        },
      };
    },
  } as unknown as FileSystemDirectoryHandle;
}

const row = (file: string) => ({ file }) as SyncEntryTableRow;

describe('file.ts behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('readFileAsync resolves with the file text', async () => {
    await expect(readFileAsync(new File(['hello world'], 'a.txt'))).resolves.toBe('hello world');
  });

  it('readFileAsync rejects when the reader fails', async () => {
    const failure = new ProgressEvent('error');
    vi.spyOn(FileReader.prototype, 'readAsText').mockImplementation(function (this: FileReader) {
      this.onerror?.(failure as ProgressEvent<FileReader>);
    });

    await expect(readFileAsync(new File(['x'], 'a.txt'))).rejects.toBe(failure);
  });

  it('getFileHandle creates intermediate folders and the final file', async () => {
    const root = memoryDir();
    const handle = await getFileHandle(root, 'data//nested/notes.txt');

    expect(handle).toBeDefined();
    await expect(root.getDirectoryHandle('data')).resolves.toBeDefined();
    const nested = await (await root.getDirectoryHandle('data')).getDirectoryHandle('nested');
    await expect(nested.getFileHandle('notes.txt')).resolves.toBeDefined();
  });

  it('getFileHandle reuses existing folders and files', async () => {
    const root = memoryDir();
    await getFileHandle(root, 'docs/a.txt');
    await expect(getFileHandle(root, 'docs/a.txt')).resolves.toBeDefined();
  });

  it('writeOutFileToRemote returns early when a handle is missing or the path is blank', async () => {
    const local = memoryDir();
    const remote = memoryDir();

    await expect(
      writeOutFileToRemote(undefined as unknown as FileSystemDirectoryHandle, local, row('a.txt')),
    ).resolves.toBeUndefined();
    await expect(
      writeOutFileToRemote(remote, undefined as unknown as FileSystemDirectoryHandle, row('a.txt')),
    ).resolves.toBeUndefined();
    await expect(writeOutFileToRemote(remote, local, row('///'))).resolves.toBeUndefined();
    await expect(remote.getFileHandle('a.txt')).rejects.toThrow();
  });

  it('writeOutFileToRemote copies local text into the remote file', async () => {
    const localEntries = new Map<string, MemoryNode>();
    const local = memoryDir(localEntries);
    const remote = memoryDir();

    const source = await getFileHandle(local, 'Group/Ind/Eval/settings.json');
    const writer = await source!.createWritable();
    await writer.write(new Blob(['{"a":1}']));
    await writer.close();

    await writeOutFileToRemote(remote, local, row('Group/Ind/Eval/settings.json'));

    const copied = await (await getFileHandle(remote, 'Group/Ind/Eval/settings.json'))!.getFile();
    expect(await copied.text()).toBe('{"a":1}');
  });

  it('syncAllFiles writes every row and appends the names to the previous remote list', async () => {
    const local = memoryDir();
    const remote = memoryDir();
    const setRemote = vi.fn();

    await syncAllFiles([row('one.txt'), row('two/three.txt')], local, remote, setRemote);

    expect(setRemote).toHaveBeenCalledTimes(1);
    const updater = setRemote.mock.calls[0][0] as (prev: string[] | null) => string[];
    expect(updater(['existing.txt'])).toEqual(['existing.txt', 'one.txt', 'two/three.txt']);
    expect(updater(null)).toEqual(['one.txt', 'two/three.txt']);
    await expect(getFileHandle(remote, 'two/three.txt')).resolves.toBeDefined();
  });
});
