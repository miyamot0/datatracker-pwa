import { describe, it, expect, beforeEach } from 'vitest';
import {
  applyStylesFile,
  buildStylesFile,
  deleteStylesFile,
  parseStylesFile,
  readStylesFile,
  restoreStylesBackup,
  saveStylesBackup,
  writeStylesFile,
} from '../styles-file';
import { setLocalShowTitle } from '../local_storage';

type Entry = FileEntry | FolderEntry;
type FileEntry = { kind: 'file'; text: string };
type FolderEntry = { kind: 'folder'; children: Map<string, Entry> };

const notFound = () => new DOMException('missing', 'NotFoundError');

/** Minimal in-memory directory tree implementing the File System Access calls used by styles-file */
function makeDirectory(children: Map<string, Entry> = new Map()): FileSystemDirectoryHandle {
  const dir = {
    async getDirectoryHandle(name: string, options?: { create?: boolean }) {
      const existing = children.get(name);
      if (existing?.kind === 'folder') return makeDirectory(existing.children);
      if (!options?.create) throw notFound();
      const folder: FolderEntry = { kind: 'folder', children: new Map() };
      children.set(name, folder);
      return makeDirectory(folder.children);
    },
    async getFileHandle(name: string, options?: { create?: boolean }) {
      const existing = children.get(name);
      if (existing?.kind !== 'file' && !options?.create) throw notFound();
      if (!existing) children.set(name, { kind: 'file', text: '' });
      return {
        async getFile() {
          return { text: async () => (children.get(name) as FileEntry).text };
        },
        async createWritable() {
          let buffer = '';
          return {
            async write(data: string) {
              buffer = data;
            },
            async close() {
              children.set(name, { kind: 'file', text: buffer });
            },
          };
        },
      };
    },
    async removeEntry(name: string) {
      if (!children.has(name)) throw notFound();
      children.delete(name);
    },
  };
  return dir as unknown as FileSystemDirectoryHandle;
}

describe('parseStylesFile', () => {
  it('accepts a minimal versioned file', () => {
    expect(parseStylesFile('{"version":1}')).toEqual({ version: 1 });
  });

  it('rejects invalid JSON, wrong versions, and wrongly typed fields', () => {
    expect(() => parseStylesFile('{not json')).toThrow(/not valid JSON/);
    expect(() => parseStylesFile('[]')).toThrow(/version 1/);
    expect(() => parseStylesFile('{"version":2}')).toThrow(/version 1/);
    expect(() => parseStylesFile('{"version":1,"showTooltip":"yes"}')).toThrow(/showTooltip/);
    expect(() => parseStylesFile('{"version":1,"seriesStyles":{"aim_lines":{}}}')).toThrow(/aim_lines/);
    expect(() => parseStylesFile('{"version":1,"plots":{"Rate":{"showTitle":1}}}')).toThrow(/showTitle/);
  });
});

describe('styles file round trip', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes, reads, applies, and deletes styles.json beside settings.json', async () => {
    const root = makeDirectory(
      new Map([
        [
          'G',
          {
            kind: 'folder',
            children: new Map([
              ['I', { kind: 'folder', children: new Map([['E', { kind: 'folder', children: new Map() }]]) }],
            ]),
          },
        ],
      ]),
    );

    setLocalShowTitle('G', 'I', 'E', 'Rate', false);
    await writeStylesFile(root, 'G', 'I', 'E');

    const read = await readStylesFile(root, 'G', 'I', 'E');
    expect(read?.plots?.Rate?.showTitle).toBe(false);

    localStorage.clear();
    applyStylesFile('G', 'I', 'E', read!);
    expect(buildStylesFile('G', 'I', 'E').plots?.Rate?.showTitle).toBe(false);

    expect(await deleteStylesFile(root, 'G', 'I', 'E')).toBe(true);
    expect(await readStylesFile(root, 'G', 'I', 'E')).toBeNull();
    expect(await deleteStylesFile(root, 'G', 'I', 'E')).toBe(false);
  });

  it('merges only fields present in the file', () => {
    localStorage.clear();
    setLocalShowTitle('G', 'I', 'E', 'Rate', false);

    applyStylesFile('G', 'I', 'E', parseStylesFile('{"version":1,"showTooltip":false}'));

    expect(buildStylesFile('G', 'I', 'E').plots?.Rate?.showTitle).toBe(false);
    expect(buildStylesFile('G', 'I', 'E').showTooltip).toBe(false);
  });

  it('restores the saved snapshot exactly and clears it', () => {
    sessionStorage.clear();
    localStorage.clear();
    setLocalShowTitle('G', 'I', 'E', 'Rate', false);
    saveStylesBackup('G', 'I', 'E');

    setLocalShowTitle('G', 'I', 'E', 'Rate', true);
    expect(buildStylesFile('G', 'I', 'E').plots?.Rate?.showTitle).toBe(true);

    expect(restoreStylesBackup('G', 'I', 'E')).toBe(true);
    expect(buildStylesFile('G', 'I', 'E').plots?.Rate?.showTitle).toBe(false);
    expect(restoreStylesBackup('G', 'I', 'E')).toBe(false);
  });

  it('returns false when no backup exists', () => {
    sessionStorage.clear();
    expect(restoreStylesBackup('G', 'I', 'E')).toBe(false);
  });
});
