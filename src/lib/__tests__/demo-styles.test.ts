import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyDemoStyles, loadDemoStyles } from '@/lib/demo-styles';
import { extractDemoArchive } from '@/lib/demo-archive';
import { DemoDataFolderName } from '@/lib/query-mutate';
import { getLocalSeriesStyles } from '@/lib/local_storage';

vi.mock('@/lib/demo-archive', () => ({
  extractDemoArchive: vi.fn(),
  fetchVerifiedDemoArchive: vi.fn(),
}));

const mockedExtractDemoArchive = vi.mocked(extractDemoArchive);

const validStyles = {
  version: 1,
  seriesStyles: {
    KeyStyles: { FCR: { shape: 'wye' } },
    ConditionStyles: {},
    phase_changes: [],
    text_annotations: [],
    aim_lines: [],
  },
};

describe('demo-styles', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('loadDemoStyles', () => {
    it('parses bundled styles.json files keyed by participant and evaluation', async () => {
      mockedExtractDemoArchive.mockReturnValue([
        {
          path: ['Participant 001', 'Tangible Treatment Evaluation'],
          filename: 'styles.json',
          bytes: new TextEncoder().encode(JSON.stringify(validStyles)),
        },
        {
          path: ['Participant 001', 'Tangible Treatment Evaluation'],
          filename: 'FC Treatment Evaluation.json',
          bytes: new TextEncoder().encode('{}'),
        },
      ]);

      const entries = await loadDemoStyles(async () => new Uint8Array());

      expect(entries).toEqual([
        {
          individual: 'Participant 001',
          evaluation: 'Tangible Treatment Evaluation',
          styles: expect.objectContaining({ version: 1 }),
        },
      ]);
    });

    it('rejects when any bundled styles.json is invalid', async () => {
      mockedExtractDemoArchive.mockReturnValue([
        {
          path: ['Participant 001', 'Tangible Treatment Evaluation'],
          filename: 'styles.json',
          bytes: new TextEncoder().encode('{"version": 2}'),
        },
      ]);

      await expect(loadDemoStyles(async () => new Uint8Array())).rejects.toThrow(
        'styles.json must be an object with version 1',
      );
    });
  });

  describe('applyDemoStyles', () => {
    it('writes parsed styles to local storage under the demo group', () => {
      applyDemoStyles([
        {
          individual: 'Participant 001',
          evaluation: 'Tangible Treatment Evaluation',
          styles: validStyles as any,
        },
      ]);

      expect(
        getLocalSeriesStyles(DemoDataFolderName, 'Participant 001', 'Tangible Treatment Evaluation'),
      ).toMatchObject({ KeyStyles: { FCR: { shape: 'wye' } } });
    });
  });
});
