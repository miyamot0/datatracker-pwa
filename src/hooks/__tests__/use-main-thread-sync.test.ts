import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMainThreadSync } from '../use-main-thread-sync';
import type { SyncEntryTableRow } from '@/types/sync';

type FakeFile = {
  kind: 'file';
  name: string;
  content: string;
  getFileReturnsNull?: boolean;
  writes: Blob[];
};

type FakeDir = {
  kind: 'directory';
  name: string;
  entries: Map<string, FakeDir | FakeFile>;
  failCreateFile?: boolean;
  failCreateDir?: boolean;
  throwOnValues?: boolean;
};

function makeFile(name: string, content = ''): FakeFile {
  return { kind: 'file', name, content, writes: [] };
}

function makeDir(name: string, children: Array<FakeDir | FakeFile> = []): FakeDir {
  return {
    kind: 'directory',
    name,
    entries: new Map(children.map((c) => [c.name, c])),
  };
}

function toFileHandle(file: FakeFile): FileSystemFileHandle {
  return {
    kind: 'file',
    name: file.name,
    getFile: async () => (file.getFileReturnsNull ? (null as unknown as File) : new File([file.content], file.name)),
    createWritable: async () => ({
      write: async (blob: Blob) => {
        file.writes.push(blob);
      },
      close: async () => {},
    }),
  } as unknown as FileSystemFileHandle;
}

function toDirHandle(dir: FakeDir): FileSystemDirectoryHandle {
  return {
    kind: 'directory',
    name: dir.name,
    values: async function* () {
      if (dir.throwOnValues) throw new Error('values failed');
      for (const entry of dir.entries.values()) {
        yield entry.kind === 'file' ? toFileHandle(entry) : toDirHandle(entry);
      }
    },
    getFileHandle: async (name: string, opts?: { create?: boolean }) => {
      const existing = dir.entries.get(name);
      if (existing?.kind === 'file') return toFileHandle(existing);
      if (existing) throw new Error(`TypeMismatchError: ${name} is a directory`);
      if (opts?.create) {
        if (dir.failCreateFile) throw new Error('cannot create file');
        const created = makeFile(name);
        dir.entries.set(name, created);
        return toFileHandle(created);
      }
      throw new Error(`NotFoundError: ${name}`);
    },
    getDirectoryHandle: async (name: string, opts?: { create?: boolean }) => {
      const existing = dir.entries.get(name);
      if (existing?.kind === 'directory') return toDirHandle(existing);
      if (existing) throw new Error(`TypeMismatchError: ${name} is a file`);
      if (opts?.create) {
        if (dir.failCreateDir) throw new Error('cannot create directory');
        const created = makeDir(name);
        dir.entries.set(name, created);
        return toDirHandle(created);
      }
      throw new Error(`NotFoundError: ${name}`);
    },
  } as unknown as FileSystemDirectoryHandle;
}

function row(file: string): SyncEntryTableRow {
  return { file } as SyncEntryTableRow;
}

describe('useMainThreadSync', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('listing files', () => {
    it('reports the worker as always ready', () => {
      const { result } = renderHook(() => useMainThreadSync());

      expect(result.current.isWorkerReady).toBe(true);
    });

    it('lists root files and nested files with parsed segments', async () => {
      const root = makeDir('root', [
        makeFile('notes.json'),
        makeDir('Group', [
          makeDir('Individual', [
            makeFile('Keyset.json'),
            makeFile('settings.json'),
            makeDir('Evaluation', [makeFile('settings.json'), makeDir('Condition', [makeFile('Outcome.json')])]),
          ]),
        ]),
      ]);

      const { result } = renderHook(() => useMainThreadSync());
      const files = await result.current.listLocalFiles(toDirHandle(root));

      expect(files).toEqual(
        expect.arrayContaining([
          {
            file: '/notes.json',
            group: 'notes.json',
            individual: '',
            evaluation: '',
            condition: '',
            type: 'session_outcome',
          },
          {
            file: '/Group/Individual/Keyset.json',
            group: 'Group',
            individual: 'Individual',
            evaluation: 'Keyset.json',
            condition: '',
            type: 'keyset',
          },
          {
            file: '/Group/Individual/settings.json',
            group: 'Group',
            individual: 'Individual',
            evaluation: 'settings.json',
            condition: '',
            type: 'keyset',
          },
          {
            file: '/Group/Individual/Evaluation/settings.json',
            group: 'Group',
            individual: 'Individual',
            evaluation: 'Evaluation',
            condition: '',
            type: 'session_parameters',
          },
          {
            file: '/Group/Individual/Evaluation/Condition/Outcome.json',
            group: 'Group',
            individual: 'Individual',
            evaluation: 'Evaluation',
            condition: 'Condition',
            type: 'session_outcome',
          },
        ]),
      );
      expect(files).toHaveLength(5);
    });

    it('skips .DS_Store files at the root and nested levels', async () => {
      const root = makeDir('root', [
        makeFile('.DS_Store'),
        makeDir('Group', [makeDir('Individual', [makeFile('.DS_Store'), makeFile('Eval.json')])]),
      ]);

      const { result } = renderHook(() => useMainThreadSync());
      const files = await result.current.listLocalFiles(toDirHandle(root));

      expect(files.map((f) => f.file)).toEqual(['/Group/Individual/Eval.json']);
    });

    it('yields to the event loop while walking large directories', async () => {
      const children = Array.from({ length: 25 }, (_, i) => makeFile(`Eval${i}.json`));
      const root = makeDir('root', [makeDir('Group', [makeDir('Individual', children)])]);

      const { result } = renderHook(() => useMainThreadSync());
      const files = await result.current.listRemoteFiles(toDirHandle(root));

      expect(files).toHaveLength(25);
    });

    it('returns an empty list when the directory cannot be enumerated', async () => {
      const root = makeDir('root', [makeFile('a.json')]);
      root.throwOnValues = true;

      const { result } = renderHook(() => useMainThreadSync());

      expect(await result.current.listLocalFiles(toDirHandle(root))).toEqual([]);
      expect(await result.current.listRemoteFiles(toDirHandle(root))).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });

    it('lists local and remote directories together', async () => {
      const local = makeDir('local', [makeDir('G', [makeDir('I', [makeFile('E.json')])])]);
      const remote = makeDir('remote', [makeDir('G2', [makeDir('I2', [makeFile('E2.json')])])]);

      const { result } = renderHook(() => useMainThreadSync());
      const both = await result.current.listBothFiles(toDirHandle(local), toDirHandle(remote));

      expect(both.localFiles.map((f) => f.file)).toEqual(['/G/I/E.json']);
      expect(both.remoteFiles.map((f) => f.file)).toEqual(['/G2/I2/E2.json']);
    });
  });

  describe('syncFiles', () => {
    it('copies each listed file from source to target and returns the synced paths', async () => {
      const source = makeDir('source', [makeDir('G', [makeDir('I', [makeFile('E.json', 'hello')])])]);
      const target = makeDir('target');

      const { result } = renderHook(() => useMainThreadSync());
      const synced = await act(() =>
        result.current.syncFiles([row('/G/I/E.json')], toDirHandle(source), toDirHandle(target)),
      );

      expect(synced).toEqual(['/G/I/E.json']);
      const copied = (target.entries.get('G') as FakeDir).entries.get('I') as FakeDir;
      const copiedFile = copied.entries.get('E.json') as FakeFile;
      expect(copiedFile.writes).toHaveLength(1);
      expect(copiedFile.writes[0].size).toBe(new Blob(['hello']).size);
    });

    it('creates the target file when it does not yet exist', async () => {
      const source = makeDir('source', [makeFile('new.json', 'x')]);
      const target = makeDir('target');

      const { result } = renderHook(() => useMainThreadSync());
      await act(() => result.current.syncFiles([row('/new.json')], toDirHandle(source), toDirHandle(target)));

      expect(target.entries.get('new.json')).toBeDefined();
    });

    it('skips files that fail and continues with the rest', async () => {
      const source = makeDir('source', [makeFile('good.json', 'ok')]);
      const target = makeDir('target');

      const { result } = renderHook(() => useMainThreadSync());
      const synced = await act(() =>
        result.current.syncFiles(
          [row('/missing.json'), row('/good.json')],
          toDirHandle(source),
          toDirHandle(target),
        ),
      );

      expect(synced).toEqual(['/good.json']);
      expect(console.error).toHaveBeenCalled();
    });

    it('reports a failure when a source directory in the path is missing', async () => {
      const source = makeDir('source');
      const target = makeDir('target');

      const { result } = renderHook(() => useMainThreadSync());
      const synced = await act(() =>
        result.current.syncFiles([row('/Nope/Nope/x.json')], toDirHandle(source), toDirHandle(target)),
      );

      expect(synced).toEqual([]);
    });

    it('reports a failure when the source file cannot be read', async () => {
      const unreadable = makeFile('bad.json', 'x');
      unreadable.getFileReturnsNull = true;
      const source = makeDir('source', [unreadable]);
      const target = makeDir('target');

      const { result } = renderHook(() => useMainThreadSync());
      const synced = await act(() =>
        result.current.syncFiles([row('/bad.json')], toDirHandle(source), toDirHandle(target)),
      );

      expect(synced).toEqual([]);
    });

    it('reports a failure when the target file cannot be created', async () => {
      const source = makeDir('source', [makeFile('a.json', 'x')]);
      const target = makeDir('target');
      target.failCreateFile = true;

      const { result } = renderHook(() => useMainThreadSync());
      const synced = await act(() =>
        result.current.syncFiles([row('/a.json')], toDirHandle(source), toDirHandle(target)),
      );

      expect(synced).toEqual([]);
    });

    it('reports a failure when target parent directories cannot be created', async () => {
      const source = makeDir('source', [makeDir('G', [makeFile('a.json', 'x')])]);
      const target = makeDir('target');
      target.failCreateDir = true;

      const { result } = renderHook(() => useMainThreadSync());
      const synced = await act(() =>
        result.current.syncFiles([row('/G/a.json')], toDirHandle(source), toDirHandle(target)),
      );

      expect(synced).toEqual([]);
    });

    it('reports a failure when the file contents cannot be read', async () => {
      const source = makeDir('source', [makeFile('a.json', 'x')]);
      const target = makeDir('target');

      const readSpy = vi
        .spyOn(FileReader.prototype, 'readAsText')
        .mockImplementation(function (this: FileReader) {
          this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>);
        });

      const { result } = renderHook(() => useMainThreadSync());
      const synced = await act(() =>
        result.current.syncFiles([row('/a.json')], toDirHandle(source), toDirHandle(target)),
      );

      expect(readSpy).toHaveBeenCalled();
      expect(synced).toEqual([]);
    });

    it('does not report rows with an empty path as synced', async () => {
      const source = makeDir('source');
      const target = makeDir('target');

      const { result } = renderHook(() => useMainThreadSync());
      const synced = await act(() => result.current.syncFiles([row('/')], toDirHandle(source), toDirHandle(target)));

      expect(synced).toEqual([]);
      expect(target.entries.size).toBe(0);
    });

    it('does not report rows as synced when a directory handle is missing', async () => {
      const source = makeDir('source', [makeFile('a.json', 'x')]);
      const target = makeDir('target');

      const { result } = renderHook(() => useMainThreadSync());
      const synced = await act(() =>
        result.current.syncFiles(
          [row('/a.json')],
          null as unknown as FileSystemDirectoryHandle,
          toDirHandle(target),
        ),
      );

      expect(synced).toEqual([]);
      expect(target.entries.size).toBe(0);
      expect(source.entries.size).toBe(1);
    });

    it('returns an empty list for no rows', async () => {
      const { result } = renderHook(() => useMainThreadSync());
      const synced = await act(() =>
        result.current.syncFiles([], toDirHandle(makeDir('s')), toDirHandle(makeDir('t'))),
      );

      expect(synced).toEqual([]);
    });

    it('yields periodically while syncing many rows', async () => {
      const children = Array.from({ length: 7 }, (_, i) => makeFile(`f${i}.json`, `${i}`));
      const source = makeDir('source', children);
      const target = makeDir('target');
      const rows = children.map((c) => row(`/${c.name}`));

      const { result } = renderHook(() => useMainThreadSync());
      const synced = await act(() => result.current.syncFiles(rows, toDirHandle(source), toDirHandle(target)));

      expect(synced).toHaveLength(7);
    });
  });
});
