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
import type { StylesFile } from '../styles-file';
import {
  getLocalCachedPrefs,
  setLocalCachedPrefs,
  setLocalFigureTextSize,
  setLocalHiddenConditions,
  setLocalShowTitle,
  setLocalSingleTarget,
} from '../local_storage';
import type { ReturnLocalStorageCache } from '../local_storage';

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

  it('always writes every portable setting to the file text, even with nothing in local storage', async () => {
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

    // A cache entry without KeyDescription must not drop hiddenKeys
    localStorage.setItem('G_I_E_Rate', JSON.stringify({ Schedule: 'End on Timer #1' }));

    await writeStylesFile(root, 'G', 'I', 'E');

    const group = root as unknown as { getDirectoryHandle: (name: string) => Promise<FileSystemDirectoryHandle> };
    const evaluation = await (
      await (await group.getDirectoryHandle('G')).getDirectoryHandle('I')
    ).getDirectoryHandle('E');
    const text = await (await (await evaluation.getFileHandle('styles.json')).getFile()).text();
    const written = JSON.parse(text) as Record<string, unknown>;

    for (const key of [
      'version',
      'seriesStyles',
      'showTooltip',
      'showConditionLegend',
      'showKeyLegend',
      'showDescription',
      'singleTarget',
      'hiddenConditions',
      'plots',
    ]) {
      expect(written, `top-level ${key}`).toHaveProperty(key);
    }

    const plots = written.plots as Record<string, Record<string, unknown>>;

    for (const plot of ['Rate', 'Proportion']) {
      for (const key of [
        'showTitle',
        'connectSpans',
        'figureLabels',
        'legendSettings',
        'fontFamily',
        'axisMax',
        'figureTextSize',
        'hiddenKeys',
      ]) {
        expect(plots[plot], `${plot}.${key}`).toHaveProperty(key);
      }
    }

    expect(written).not.toHaveProperty('schedule');
    expect(text).not.toContain('Schedule');
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

  it('round trips every portable setting and leaves the schedule out of the file', () => {
    localStorage.clear();
    setLocalSingleTarget('G', 'I', 'E', true);
    setLocalHiddenConditions('G', 'I', 'E', ['Condition B']);
    setLocalFigureTextSize('G', 'I', 'E', 'Rate', 'large');
    setLocalCachedPrefs('G', 'I', 'E', 'Rate', {
      KeyDescription: ['Key 1'],
      Schedule: ['Schedule A'],
    } as ReturnLocalStorageCache);

    const built = buildStylesFile('G', 'I', 'E');
    const serialized = JSON.stringify(built);
    expect(serialized).not.toContain('Schedule A');

    const reparsed = parseStylesFile(serialized);
    expect(reparsed.singleTarget).toBe(true);
    expect(reparsed.hiddenConditions).toEqual(['Condition B']);
    expect(reparsed.plots?.Rate?.figureTextSize).toBe('large');
    expect(reparsed.plots?.Rate?.hiddenKeys).toEqual(['Key 1']);

    localStorage.clear();
    setLocalCachedPrefs('G', 'I', 'E', 'Rate', {
      KeyDescription: [],
      Schedule: ['Local schedule'],
    } as ReturnLocalStorageCache);
    applyStylesFile('G', 'I', 'E', reparsed);

    expect(buildStylesFile('G', 'I', 'E')).toEqual(built);
    expect(getLocalCachedPrefs('G', 'I', 'E', 'Rate').Schedule).toEqual(['Local schedule']);
  });
});

describe('parseStylesFile validation messages', () => {
  it('rejects each wrongly typed top-level flag', () => {
    for (const key of ['showConditionLegend', 'showKeyLegend', 'showDescription']) {
      expect(() => parseStylesFile(`{"version":1,"${key}":"yes"}`)).toThrow(`${key} must be true or false`);
    }
  });

  it('rejects a non-object seriesStyles and non-object series maps', () => {
    expect(() => parseStylesFile('{"version":1,"seriesStyles":[]}')).toThrow('seriesStyles must be an object');
    expect(() => parseStylesFile('{"version":1,"seriesStyles":{"KeyStyles":[]}}')).toThrow(
      'seriesStyles.KeyStyles must be an object',
    );
    expect(() => parseStylesFile('{"version":1,"seriesStyles":{"ConditionStyles":"x"}}')).toThrow(
      'seriesStyles.ConditionStyles must be an object',
    );
  });

  it('rejects a non-object plots value and non-object plot entries', () => {
    expect(() => parseStylesFile('{"version":1,"plots":[]}')).toThrow('plots must be an object');
    expect(() => parseStylesFile('{"version":1,"plots":{"Proportion":"x"}}')).toThrow(
      'plots.Proportion must be an object',
    );
  });

  it('rejects wrongly typed plot flags and plot sub-objects', () => {
    expect(() => parseStylesFile('{"version":1,"plots":{"Rate":{"connectSpans":"no"}}}')).toThrow(
      'plots.Rate.connectSpans must be true or false',
    );
    expect(() => parseStylesFile('{"version":1,"plots":{"Rate":{"figureLabels":[]}}}')).toThrow(
      'plots.Rate.figureLabels must be an object',
    );
    expect(() => parseStylesFile('{"version":1,"plots":{"Rate":{"legendSettings":1}}}')).toThrow(
      'plots.Rate.legendSettings must be an object',
    );
  });

  it('accepts a fully populated, valid file and ignores undefined plots', () => {
    const text = JSON.stringify({
      version: 1,
      showTooltip: true,
      showConditionLegend: false,
      showKeyLegend: true,
      showDescription: true,
      seriesStyles: { KeyStyles: {}, ConditionStyles: {}, phase_changes: [], text_annotations: [], aim_lines: [] },
      plots: {
        Rate: { showTitle: true, connectSpans: false, figureLabels: {}, legendSettings: {} },
        Proportion: undefined,
      },
    });
    expect(parseStylesFile(text).showDescription).toBe(true);
  });
});

describe('applyStylesFile branches', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const seriesFile = (seriesStyles: object) => ({ version: 1, seriesStyles }) as unknown as StylesFile;

  it('replace overwrites every series field and defaults missing ones to empty', () => {
    applyStylesFile(
      'G',
      'I',
      'E',
      seriesFile({ KeyStyles: { A: { color: 'red' } }, phase_changes: [{ position: 1, lineType: 'solid' }] }),
    );

    applyStylesFile('G', 'I', 'E', seriesFile({}), { replace: true });

    expect(buildStylesFile('G', 'I', 'E').seriesStyles).toEqual({
      KeyStyles: {},
      ConditionStyles: {},
      phase_changes: [],
      text_annotations: [],
      aim_lines: [],
    });
  });

  it('merge keeps existing series entries and lists when the file omits them', () => {
    applyStylesFile(
      'G',
      'I',
      'E',
      seriesFile({ KeyStyles: { A: { color: 'red' } }, phase_changes: [{ position: 1, lineType: 'solid' }] }),
    );

    applyStylesFile('G', 'I', 'E', seriesFile({ KeyStyles: { B: { color: 'blue' } } }));

    const merged = buildStylesFile('G', 'I', 'E').seriesStyles!;
    expect(merged.KeyStyles).toEqual({ A: { color: 'red' }, B: { color: 'blue' } });
    expect(merged.phase_changes).toEqual([{ position: 1, lineType: 'solid' }]);
  });

  it('merge replaces lists when the file provides them', () => {
    applyStylesFile('G', 'I', 'E', seriesFile({ phase_changes: [{ position: 1, lineType: 'solid' }] }));

    applyStylesFile('G', 'I', 'E', seriesFile({ phase_changes: [{ position: 9, lineType: 'dashed' }] }));

    expect(buildStylesFile('G', 'I', 'E').seriesStyles!.phase_changes).toEqual([{ position: 9, lineType: 'dashed' }]);
  });

  it('applies top-level flags only when they are present', () => {
    applyStylesFile('G', 'I', 'E', {
      version: 1,
      showTooltip: false,
      showConditionLegend: true,
      showKeyLegend: false,
      showDescription: false,
    } as StylesFile);

    const built = buildStylesFile('G', 'I', 'E');
    expect(built.showTooltip).toBe(false);
    expect(built.showConditionLegend).toBe(true);
    expect(built.showKeyLegend).toBe(false);
    expect(built.showDescription).toBe(false);
  });

  it('applies plot fields and skips plots that are absent', () => {
    const defaults = buildStylesFile('G', 'I', 'E').plots.Rate;
    const figureLabels = { ...defaults.figureLabels, overrideTitle: true, titleText: 'Rate' };
    const legendSettings = Object.fromEntries(
      Object.entries(defaults.legendSettings).map(([key, value]) => [key, typeof value === 'boolean' ? !value : value]),
    );

    applyStylesFile('G', 'I', 'E', {
      version: 1,
      plots: {
        Rate: { showTitle: false, connectSpans: true, figureLabels, legendSettings },
      },
    } as StylesFile);

    const rate = buildStylesFile('G', 'I', 'E').plots.Rate;
    expect(rate.showTitle).toBe(false);
    expect(rate.connectSpans).toBe(true);
    expect(rate.figureLabels).toMatchObject(figureLabels);
    expect(rate.legendSettings).toMatchObject(legendSettings);
  });

  it('parses and applies fontFamily and axisMax, rejecting invalid values', () => {
    const axisMax = { overrideXMax: true, xMax: 40, overrideYMax: false, yMax: null };
    applyStylesFile('G', 'I', 'E', {
      version: 1,
      plots: { Rate: { fontFamily: 'timesNewRoman', axisMax } },
    } as StylesFile);

    const rate = buildStylesFile('G', 'I', 'E').plots.Rate;
    expect(rate.fontFamily).toBe('timesNewRoman');
    expect(rate.axisMax).toEqual(axisMax);

    expect(() => parseStylesFile('{"version":1,"plots":{"Rate":{"fontFamily":"comic"}}}')).toThrow(/fontFamily/);
    expect(() =>
      parseStylesFile(
        '{"version":1,"plots":{"Rate":{"axisMax":{"overrideXMax":true,"xMax":-1,"overrideYMax":false,"yMax":null}}}}',
      ),
    ).toThrow(/axisMax/);
  });

  it('leaves plot fields untouched when they are not in the file', () => {
    applyStylesFile('G', 'I', 'E', { version: 1, plots: { Rate: {} } } as StylesFile);
    expect(buildStylesFile('G', 'I', 'E').plots.Rate.showTitle).toBe(true);
  });
});

describe('readStylesFile and deleteStylesFile error handling', () => {
  /** Directory tree whose evaluation folder throws the given error for every file operation */
  function rootThrowing(error: unknown): FileSystemDirectoryHandle {
    const evaluation = {
      getFileHandle: async () => {
        throw error;
      },
      removeEntry: async () => {
        throw error;
      },
    };
    const individual = { getDirectoryHandle: async () => evaluation };
    const group = { getDirectoryHandle: async () => individual };
    return { getDirectoryHandle: async () => group } as unknown as FileSystemDirectoryHandle;
  }

  it('readStylesFile rethrows errors other than NotFound', async () => {
    const failure = new Error('permission denied');
    await expect(readStylesFile(rootThrowing(failure), 'G', 'I', 'E')).rejects.toBe(failure);
  });

  it('deleteStylesFile rethrows errors other than NotFound', async () => {
    const failure = new DOMException('locked', 'NoModificationAllowedError');
    await expect(deleteStylesFile(rootThrowing(failure), 'G', 'I', 'E')).rejects.toBe(failure);
  });

  it('readStylesFile and deleteStylesFile report NotFound as null and false', async () => {
    const missing = rootThrowing(new DOMException('missing', 'NotFoundError'));
    await expect(readStylesFile(missing, 'G', 'I', 'E')).resolves.toBeNull();
    await expect(deleteStylesFile(missing, 'G', 'I', 'E')).resolves.toBe(false);
  });
});
