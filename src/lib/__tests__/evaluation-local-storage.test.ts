import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  EVALUATION_SETTING_NAMES,
  PLOT_SETTING_NAMES,
  clearEvaluationLocalStorage,
  clearEvaluationPaths,
  copyEvaluationLocalStorage,
  evaluationStorageKeys,
  listEvaluationPathsForGroups,
  listEvaluationPathsForIndividuals,
  moveEvaluationLocalStorage,
} from '../evaluation-local-storage';
import { saveStylesBackup } from '../styles-file';
import {
  setLocalCachedPrefs,
  setLocalConnectSpans,
  setLocalFigureTextSize,
  setLocalHiddenConditions,
  setLocalShowKeyLegend,
  setLocalShowTitle,
  setLocalSingleTarget,
} from '../local_storage';

type Tree = { [name: string]: Tree };

function makeDirectory(tree: Tree): FileSystemDirectoryHandle {
  return {
    async getDirectoryHandle(name: string) {
      if (!(name in tree)) throw new DOMException('missing', 'NotFoundError');
      return makeDirectory(tree[name]);
    },
    async *entries() {
      for (const name of Object.keys(tree)) {
        yield [name, { kind: 'directory' }];
      }
      yield ['.DS_Store', { kind: 'file' }];
      yield ['notes.txt', { kind: 'file' }];
    },
  } as unknown as FileSystemDirectoryHandle;
}

const source = { group: 'G', individual: 'I', evaluation: 'Demand' };
const copy = { group: 'G', individual: 'I', evaluation: 'Demand_Copy' };

describe('evaluation storage key list', () => {
  it('covers every setting name used in local_storage.ts', () => {
    const text = fs.readFileSync(path.resolve('src/lib/local_storage.ts'), 'utf8');
    const names = new Set<string>();

    for (const match of text.matchAll(/Evaluation\.trim\(\), '(\w+)'(?:, Plot)?\]/g)) {
      names.add(match[1]);
    }

    const known = new Set<string>([...EVALUATION_SETTING_NAMES, ...PLOT_SETTING_NAMES]);

    expect(names.size).toBeGreaterThan(10);
    for (const name of names) {
      expect(
        known.has(name),
        `${name} is stored in local_storage.ts but missing from evaluation-local-storage.ts`,
      ).toBe(true);
    }
  });

  it('includes every key written by the setters, with no duplicates', () => {
    setLocalShowTitle('G', 'I', 'Demand', 'Rate', false);
    setLocalShowTitle('G', 'I', 'Demand', 'Proportion', false);
    setLocalConnectSpans('G', 'I', 'Demand', 'Rate', true);
    setLocalFigureTextSize('G', 'I', 'Demand', 'Proportion', 'large');
    setLocalHiddenConditions('G', 'I', 'Demand', ['Baseline']);
    setLocalShowKeyLegend('G', 'I', 'Demand', false);
    setLocalSingleTarget('G', 'I', 'Demand', true);
    setLocalCachedPrefs('G', 'I', 'Demand', 'Rate', { KeyDescription: ['A'], Schedule: 'End on Timer #1' });
    setLocalCachedPrefs('G', 'I', 'Demand', 'Duration', { KeyDescription: ['B'], Schedule: 'End on Timer #1' });
    setLocalCachedPrefs('G', 'I', 'Demand', 'G I Demand', { KeyDescription: ['C'], Schedule: 'End on Timer #1' });

    const keys = evaluationStorageKeys('G', 'I', 'Demand');
    const written = Object.keys(localStorage).filter((key) => key.startsWith('G_I_Demand_'));

    expect(new Set(keys).size).toBe(keys.length);
    expect(written.length).toBe(10);
    for (const key of written) {
      expect(keys).toContain(key);
    }
  });
});

describe('clearEvaluationLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('removes every setting and the undo snapshot for the evaluation', () => {
    setLocalShowTitle('G', 'I', 'Demand', 'Rate', false);
    setLocalHiddenConditions('G', 'I', 'Demand', ['Baseline']);
    setLocalCachedPrefs('G', 'I', 'Demand', 'Rate', { KeyDescription: ['A'], Schedule: 'End on Timer #1' });
    setLocalCachedPrefs('G', 'I', 'Demand', 'G I Demand', { KeyDescription: ['A'], Schedule: 'End on Timer #1' });
    saveStylesBackup('G', 'I', 'Demand');

    clearEvaluationLocalStorage('G', 'I', 'Demand');

    expect(Object.keys(localStorage)).toEqual([]);
    expect(sessionStorage.length).toBe(0);
  });

  it('leaves look-alike names alone', () => {
    setLocalShowTitle('G', 'I', 'Demand', 'Rate', false);
    setLocalShowTitle('G', 'I', 'Demand_Copy', 'Rate', false);
    setLocalShowTitle('G', 'I_2', 'Demand', 'Rate', false);
    setLocalShowTitle('G_I', 'Demand', 'X', 'Rate', false);

    clearEvaluationLocalStorage('G', 'I', 'Demand');

    expect(Object.keys(localStorage).sort()).toEqual([
      'G_I_2_Demand_ShowTitle_Rate',
      'G_I_Demand_Copy_ShowTitle_Rate',
      'G_I_Demand_X_ShowTitle_Rate',
    ]);
  });
});

describe('copyEvaluationLocalStorage and moveEvaluationLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('copies every setting, including hidden keys and the schedule, and leaves the source intact', () => {
    setLocalShowTitle('G', 'I', 'Demand', 'Rate', false);
    setLocalSingleTarget('G', 'I', 'Demand', true);
    setLocalHiddenConditions('G', 'I', 'Demand', ['Baseline']);
    setLocalCachedPrefs('G', 'I', 'Demand', 'Rate', { KeyDescription: ['SIB'], Schedule: 'End on Timer #2' });
    setLocalCachedPrefs('G', 'I', 'Demand', 'G I Demand', { KeyDescription: ['AGG'], Schedule: 'End on Timer #1' });

    copyEvaluationLocalStorage(source, copy);

    expect(localStorage.getItem('G_I_Demand_Copy_ShowTitle_Rate')).toBe('false');
    expect(localStorage.getItem('G_I_Demand_Copy_SingleTarget')).toBe('true');
    expect(localStorage.getItem('G_I_Demand_Copy_HiddenConditions')).toBe('["Baseline"]');
    expect(JSON.parse(localStorage.getItem('G_I_Demand_Copy_Rate')!)).toEqual({
      KeyDescription: ['SIB'],
      Schedule: 'End on Timer #2',
    });
    expect(JSON.parse(localStorage.getItem('G_I_Demand_Copy_G I Demand_Copy')!)).toEqual({
      KeyDescription: ['AGG'],
      Schedule: 'End on Timer #1',
    });
    expect(localStorage.getItem('G_I_Demand_ShowTitle_Rate')).toBe('false');
  });

  it('removes stale settings on the target that the source does not have', () => {
    setLocalShowTitle('G', 'I', 'Demand_Copy', 'Rate', false);
    setLocalSingleTarget('G', 'I', 'Demand', true);

    copyEvaluationLocalStorage(source, copy);

    expect(localStorage.getItem('G_I_Demand_Copy_ShowTitle_Rate')).toBeNull();
    expect(localStorage.getItem('G_I_Demand_Copy_SingleTarget')).toBe('true');
  });

  it('does not copy the undo snapshot', () => {
    setLocalShowTitle('G', 'I', 'Demand', 'Rate', false);
    saveStylesBackup('G', 'I', 'Demand');

    copyEvaluationLocalStorage(source, copy);

    expect(sessionStorage.length).toBe(1);
  });

  it('moves settings to the new name and clears the old one', () => {
    setLocalShowTitle('G', 'I', 'Demand', 'Rate', false);
    setLocalCachedPrefs('G', 'I', 'Demand', 'Rate', { KeyDescription: ['SIB'], Schedule: 'End on Timer #1' });
    saveStylesBackup('G', 'I', 'Demand');

    moveEvaluationLocalStorage(source, { group: 'G', individual: 'I', evaluation: 'Renamed' });

    expect(Object.keys(localStorage).sort()).toEqual(['G_I_Renamed_Rate', 'G_I_Renamed_ShowTitle_Rate']);
    expect(sessionStorage.length).toBe(0);
  });

  it('keeps everything when the old and new names are the same', () => {
    setLocalShowTitle('G', 'I', 'Demand', 'Rate', false);

    moveEvaluationLocalStorage(source, source);

    expect(localStorage.getItem('G_I_Demand_ShowTitle_Rate')).toBe('false');
  });
});

describe('listing evaluation folders', () => {
  const tree: Tree = {
    G: { I: { Demand: {}, FA: {} }, J: { Tangible: {} }, Empty: {} },
    H: { K: { Other: {} } },
  };

  it('lists the evaluations under individuals and skips files', async () => {
    const paths = await listEvaluationPathsForIndividuals(makeDirectory(tree), 'G', ['I', 'J', 'Empty']);

    expect(paths).toEqual([
      { group: 'G', individual: 'I', evaluation: 'Demand' },
      { group: 'G', individual: 'I', evaluation: 'FA' },
      { group: 'G', individual: 'J', evaluation: 'Tangible' },
    ]);
  });

  it('lists the evaluations under groups', async () => {
    const paths = await listEvaluationPathsForGroups(makeDirectory(tree), ['G', 'H']);

    expect(paths.map((p) => `${p.group}/${p.individual}/${p.evaluation}`)).toEqual([
      'G/I/Demand',
      'G/I/FA',
      'G/J/Tangible',
      'H/K/Other',
    ]);
  });

  it('returns what it can when folders are missing', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await listEvaluationPathsForIndividuals(makeDirectory(tree), 'Missing', ['I'])).toEqual([]);
    expect(await listEvaluationPathsForIndividuals(makeDirectory(tree), 'G', ['Missing', 'J'])).toEqual([
      { group: 'G', individual: 'J', evaluation: 'Tangible' },
    ]);
    expect(await listEvaluationPathsForGroups(makeDirectory(tree), ['Missing'])).toEqual([]);
  });
});

describe('clearEvaluationPaths', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('clears every listed evaluation and keeps going when one fails', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    setLocalShowTitle('G', 'I', 'A', 'Rate', false);
    setLocalShowTitle('G', 'I', 'B', 'Rate', false);
    setLocalShowTitle('G', 'I', 'Keep', 'Rate', false);

    const removeItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
      throw new Error('quota');
    });

    clearEvaluationPaths([
      { group: 'G', individual: 'I', evaluation: 'A' },
      { group: 'G', individual: 'I', evaluation: 'B' },
    ]);

    removeItem.mockRestore();

    expect(localStorage.getItem('G_I_B_ShowTitle_Rate')).toBeNull();
    expect(localStorage.getItem('G_I_Keep_ShowTitle_Rate')).toBe('false');
  });
});
