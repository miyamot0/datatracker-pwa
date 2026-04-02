import { generateChunkedVisuals } from '../displays';
import { chunking } from '../arrays';
import { KeySet, KeySetInstance } from '@/types/keyset';
import { ScreenSizingTypes } from '@/types/settings/display-settings';

// Mock the arrays module
vi.mock('../arrays', () => ({
  chunking: vi.fn(),
}));

const mockChunking = vi.mocked(chunking);

describe('generateChunkedVisuals', () => {
  const createKeySetInstance = (count: number, prefix: string): KeySetInstance[] => {
    return Array.from({ length: count }, (_, i) => ({
      KeyName: `${prefix}${i + 1}`,
      KeyDescription: `${prefix} Key ${i + 1}`,
      KeyCode: i + 1,
    }));
  };

  const createMockKeySet = (freqCount: number, durCount: number): KeySet => ({
    id: 'test-keyset',
    Name: 'Test KeySet',
    FrequencyKeys: createKeySetInstance(freqCount, 'F'),
    DurationKeys: createKeySetInstance(durCount, 'D'),
    DerivedKeys: [],
    createdAt: new Date('2023-01-01'),
    lastModified: new Date('2023-01-02'),
    SpecialDurationKeys: [],
    ScorableDurationKeys: [],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default chunking mock to return the input array as a single chunk
    mockChunking.mockImplementation(function* <T>(arr: T[], n: number) {
      for (let i = 0; i < arr.length; i += n) {
        yield arr.slice(i, i + n);
      }
    });
  });

  describe('when isDense is false', () => {
    const testCases: { displaySize: ScreenSizingTypes; description: string }[] = [
      { displaySize: 'standard', description: 'standard display' },
      { displaySize: 'wide', description: 'wide display' },
      { displaySize: 'extra-wide', description: 'extra-wide display' },
    ];

    testCases.forEach(({ displaySize, description }) => {
      it(`should return single chunks for all keys when not dense with ${description}`, () => {
        const keyset = createMockKeySet(10, 8);
        const freqKeys = createKeySetInstance(10, 'F');
        const durKeys = createKeySetInstance(8, 'D');

        const result = generateChunkedVisuals(keyset, freqKeys, durKeys, false, displaySize);

        expect(result).toEqual({
          TablesF: 1,
          TablesD: 1,
          FrequencyKeyChunks: [freqKeys],
          DurationKeyChunks: [durKeys],
        });

        // Chunking should not be called when isDense is false
        expect(mockChunking).not.toHaveBeenCalled();
      });
    });

    it('should handle empty key arrays when not dense', () => {
      const keyset = createMockKeySet(0, 0);
      const result = generateChunkedVisuals(keyset, [], [], false, 'standard');

      expect(result).toEqual({
        TablesF: 1,
        TablesD: 1,
        FrequencyKeyChunks: [[]],
        DurationKeyChunks: [[]],
      });
    });
  });

  describe('when isDense is true', () => {
    describe('display size handling', () => {
      it('should use 2 columns for standard display size when dense', () => {
        const keyset = createMockKeySet(12, 12);
        const freqKeys = createKeySetInstance(12, 'F');
        const durKeys = createKeySetInstance(12, 'D');

        mockChunking.mockImplementation(function* <T>(arr: T[], n: number) {
          // Mock returning 2 chunks of 6 items each
          yield arr.slice(0, n);
          yield arr.slice(n, n * 2);
        });

        const result = generateChunkedVisuals(keyset, freqKeys, durKeys, true, 'standard');

        expect(result.TablesF).toBe(2);
        expect(result.TablesD).toBe(2);
        expect(mockChunking).toHaveBeenCalledWith(keyset.FrequencyKeys, 6); // ceil(12/2)
        expect(mockChunking).toHaveBeenCalledWith(keyset.DurationKeys, 6); // ceil(12/2)
      });

      it('should use 2 columns for wide display size when dense', () => {
        const keyset = createMockKeySet(12, 12);
        const freqKeys = createKeySetInstance(12, 'F');
        const durKeys = createKeySetInstance(12, 'D');

        mockChunking.mockImplementation(function* <T>(arr: T[], n: number) {
          yield arr.slice(0, n);
          yield arr.slice(n, n * 2);
        });

        const result = generateChunkedVisuals(keyset, freqKeys, durKeys, true, 'wide');

        expect(result.TablesF).toBe(2);
        expect(result.TablesD).toBe(2);
        expect(mockChunking).toHaveBeenCalledWith(keyset.FrequencyKeys, 6); // ceil(12/2)
        expect(mockChunking).toHaveBeenCalledWith(keyset.DurationKeys, 6); // ceil(12/2)
      });

      it('should use 3 columns for extra-wide display size when dense', () => {
        const keyset = createMockKeySet(15, 15);
        const freqKeys = createKeySetInstance(15, 'F');
        const durKeys = createKeySetInstance(15, 'D');

        mockChunking.mockImplementation(function* <T>(arr: T[], n: number) {
          yield arr.slice(0, n);
          yield arr.slice(n, n * 2);
          yield arr.slice(n * 2, n * 3);
        });

        const result = generateChunkedVisuals(keyset, freqKeys, durKeys, true, 'extra-wide');

        expect(result.TablesF).toBe(3);
        expect(result.TablesD).toBe(3);
        expect(mockChunking).toHaveBeenCalledWith(keyset.FrequencyKeys, 5); // ceil(15/3)
        expect(mockChunking).toHaveBeenCalledWith(keyset.DurationKeys, 5); // ceil(15/3)
      });
    });

    describe('frequency key count handling', () => {
      it('should use 1 column when frequency keys count is less than MIN_KEY_COUNT_FOR_SPLIT_TWO_COL (6)', () => {
        const keyset = createMockKeySet(5, 12);
        const freqKeys = createKeySetInstance(5, 'F');
        const durKeys = createKeySetInstance(12, 'D');

        mockChunking.mockImplementation(function* <T>(arr: T[], n: number) {
          yield arr.slice(0, n);
          if (arr.length > n) yield arr.slice(n, n * 2);
        });

        const result = generateChunkedVisuals(keyset, freqKeys, durKeys, true, 'standard');

        expect(result.TablesF).toBe(1);
        expect(result.TablesD).toBe(2); // Duration keys have 12 items, so 2 columns
        expect(mockChunking).toHaveBeenCalledWith(keyset.FrequencyKeys, 5); // ceil(5/1)
        expect(mockChunking).toHaveBeenCalledWith(keyset.DurationKeys, 6); // ceil(12/2)
      });

      it('should use 2 columns when frequency keys count is between 6 and 11', () => {
        const keyset = createMockKeySet(8, 5);
        const freqKeys = createKeySetInstance(8, 'F');
        const durKeys = createKeySetInstance(5, 'D');

        mockChunking.mockImplementation(function* <T>(arr: T[], n: number) {
          yield arr.slice(0, n);
          if (arr.length > n) yield arr.slice(n, n * 2);
        });

        const result = generateChunkedVisuals(keyset, freqKeys, durKeys, true, 'standard');

        expect(result.TablesF).toBe(2);
        expect(result.TablesD).toBe(1); // Duration keys have 5 items, so 1 column
        expect(mockChunking).toHaveBeenCalledWith(keyset.FrequencyKeys, 4); // ceil(8/2)
        expect(mockChunking).toHaveBeenCalledWith(keyset.DurationKeys, 5); // ceil(5/1)
      });

      it('should use appropriate columns for extra-wide when frequency keys count >= 12', () => {
        const keyset = createMockKeySet(15, 5);
        const freqKeys = createKeySetInstance(15, 'F');
        const durKeys = createKeySetInstance(5, 'D');

        mockChunking.mockImplementation(function* <T>(arr: T[], n: number) {
          yield arr.slice(0, n);
          if (arr.length > n) yield arr.slice(n, n * 2);
          if (arr.length > n * 2) yield arr.slice(n * 2, n * 3);
        });

        const result = generateChunkedVisuals(keyset, freqKeys, durKeys, true, 'extra-wide');

        expect(result.TablesF).toBe(3); // nCols = 3 for extra-wide and >= 12 items
        expect(result.TablesD).toBe(1); // Duration keys have 5 items, so 1 column
        expect(mockChunking).toHaveBeenCalledWith(keyset.FrequencyKeys, 5); // ceil(15/3)
        expect(mockChunking).toHaveBeenCalledWith(keyset.DurationKeys, 5); // ceil(5/1)
      });
    });

    describe('duration key count handling', () => {
      it('should use 1 column when duration keys count is less than MIN_KEY_COUNT_FOR_SPLIT_TWO_COL (6)', () => {
        const keyset = createMockKeySet(12, 4);
        const freqKeys = createKeySetInstance(12, 'F');
        const durKeys = createKeySetInstance(4, 'D');

        mockChunking.mockImplementation(function* <T>(arr: T[], n: number) {
          yield arr.slice(0, n);
          if (arr.length > n) yield arr.slice(n, n * 2);
        });

        const result = generateChunkedVisuals(keyset, freqKeys, durKeys, true, 'standard');

        expect(result.TablesF).toBe(2); // Frequency keys have 12 items, so 2 columns
        expect(result.TablesD).toBe(1);
        expect(mockChunking).toHaveBeenCalledWith(keyset.FrequencyKeys, 6); // ceil(12/2)
        expect(mockChunking).toHaveBeenCalledWith(keyset.DurationKeys, 4); // ceil(4/1)
      });

      it('should use 2 columns when duration keys count is between 6 and 11', () => {
        const keyset = createMockKeySet(5, 9);
        const freqKeys = createKeySetInstance(5, 'F');
        const durKeys = createKeySetInstance(9, 'D');

        mockChunking.mockImplementation(function* <T>(arr: T[], n: number) {
          yield arr.slice(0, n);
          if (arr.length > n) yield arr.slice(n, n * 2);
        });

        const result = generateChunkedVisuals(keyset, freqKeys, durKeys, true, 'standard');

        expect(result.TablesF).toBe(1); // Frequency keys have 5 items, so 1 column
        expect(result.TablesD).toBe(2);
        expect(mockChunking).toHaveBeenCalledWith(keyset.FrequencyKeys, 5); // ceil(5/1)
        expect(mockChunking).toHaveBeenCalledWith(keyset.DurationKeys, 5); // ceil(9/2) = 5
      });

      it('should use appropriate columns for extra-wide when duration keys count >= 12', () => {
        const keyset = createMockKeySet(5, 18);
        const freqKeys = createKeySetInstance(5, 'F');
        const durKeys = createKeySetInstance(18, 'D');

        mockChunking.mockImplementation(function* <T>(arr: T[], n: number) {
          yield arr.slice(0, n);
          if (arr.length > n) yield arr.slice(n, n * 2);
          if (arr.length > n * 2) yield arr.slice(n * 2, n * 3);
        });

        const result = generateChunkedVisuals(keyset, freqKeys, durKeys, true, 'extra-wide');

        expect(result.TablesF).toBe(1); // Frequency keys have 5 items, so 1 column
        expect(result.TablesD).toBe(3); // nCols = 3 for extra-wide and >= 12 items
        expect(mockChunking).toHaveBeenCalledWith(keyset.FrequencyKeys, 5); // ceil(5/1)
        expect(mockChunking).toHaveBeenCalledWith(keyset.DurationKeys, 6); // ceil(18/3)
      });
    });

    describe('edge cases', () => {
      it('should handle empty frequency keys when dense', () => {
        const keyset = createMockKeySet(0, 8);
        const freqKeys: KeySetInstance[] = [];
        const durKeys = createKeySetInstance(8, 'D');

        mockChunking.mockImplementation(function* <T>(arr: T[], n: number) {
          if (arr.length === 0) return;
          yield arr.slice(0, n);
          if (arr.length > n) yield arr.slice(n, n * 2);
        });

        const result = generateChunkedVisuals(keyset, freqKeys, durKeys, true, 'standard');

        expect(result.TablesF).toBe(1);
        expect(result.TablesD).toBe(2);
        expect(result.FrequencyKeyChunks).toEqual([]);
      });

      it('should handle empty duration keys when dense', () => {
        const keyset = createMockKeySet(8, 0);
        const freqKeys = createKeySetInstance(8, 'F');
        const durKeys: KeySetInstance[] = [];

        mockChunking.mockImplementation(function* <T>(arr: T[], n: number) {
          if (arr.length === 0) return;
          yield arr.slice(0, n);
          if (arr.length > n) yield arr.slice(n, n * 2);
        });

        const result = generateChunkedVisuals(keyset, freqKeys, durKeys, true, 'standard');

        expect(result.TablesF).toBe(2);
        expect(result.TablesD).toBe(1);
        expect(result.DurationKeyChunks).toEqual([]);
      });

      it('should handle both empty key arrays when dense', () => {
        const keyset = createMockKeySet(0, 0);

        mockChunking.mockImplementation(function* <T>(arr: T[], _n: number) {
          if (arr.length === 0) return;
        });

        const result = generateChunkedVisuals(keyset, [], [], true, 'standard');

        expect(result.TablesF).toBe(1);
        expect(result.TablesD).toBe(1);
        expect(result.FrequencyKeyChunks).toEqual([]);
        expect(result.DurationKeyChunks).toEqual([]);
      });
    });

    describe('math.ceil behavior verification', () => {
      it('should calculate correct chunk sizes using Math.ceil', () => {
        const keyset = createMockKeySet(7, 5);
        const freqKeys = createKeySetInstance(7, 'F');
        const durKeys = createKeySetInstance(5, 'D');

        generateChunkedVisuals(keyset, freqKeys, durKeys, true, 'standard');

        // 7 frequency keys with 2 columns should use ceil(7/2) = 4 per chunk
        // 5 duration keys with 1 column should use ceil(5/1) = 5 per chunk
        expect(mockChunking).toHaveBeenCalledWith(keyset.FrequencyKeys, 4); // ceil(7/2)
        expect(mockChunking).toHaveBeenCalledWith(keyset.DurationKeys, 5); // ceil(5/1)
      });
    });
  });
});
