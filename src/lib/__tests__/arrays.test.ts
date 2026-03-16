import { describe, it, expect } from 'vitest';
import { splitAtPoints } from '../arrays';

describe('splitAtPoints', () => {
  describe('basic functionality', () => {
    it('should split array at single point', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = splitAtPoints(arr, [3]);

      expect(result).toEqual([
        [1, 2, 3],
        [4, 5],
      ]);
    });

    it('should split array at multiple points', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8];
      const result = splitAtPoints(arr, [2, 5, 7]);

      expect(result).toEqual([[1, 2], [3, 4, 5], [6, 7], [8]]);
    });

    it('should handle unordered split points', () => {
      const arr = [1, 2, 3, 4, 5, 6];
      const result = splitAtPoints(arr, [5, 2, 4]);

      expect(result).toEqual([[1, 2], [3, 4], [5], [6]]);
    });
  });

  describe('edge cases with points', () => {
    it('should handle empty points array', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = splitAtPoints(arr, []);

      expect(result).toEqual([[1, 2, 3, 4, 5]]);
    });

    it('should handle duplicate points', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = splitAtPoints(arr, [2, 2, 4, 2]);

      expect(result).toEqual([[1, 2], [], [], [3, 4], [5]]);
    });

    it('should handle point at beginning (0)', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = splitAtPoints(arr, [0, 3]);

      expect(result).toEqual([[], [1, 2, 3], [4, 5]]);
    });

    it('should handle point at end (array.length)', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = splitAtPoints(arr, [2, 5]);

      expect(result).toEqual([[1, 2], [3, 4, 5], []]);
    });

    it('should handle points beyond array length', () => {
      const arr = [1, 2, 3];
      const result = splitAtPoints(arr, [1, 10, 15]);

      expect(result).toEqual([[1], [2, 3], [], []]);
    });

    it('should handle negative points', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = splitAtPoints(arr, [-5, -1, 2]);

      expect(result).toEqual([[], [1, 2, 3, 4], [], [3, 4, 5]]);
    });

    it('should handle all points being the same', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = splitAtPoints(arr, [3, 3, 3]);

      expect(result).toEqual([[1, 2, 3], [], [], [4, 5]]);
    });
  });

  describe('edge cases with arrays', () => {
    it('should handle empty array', () => {
      const arr: number[] = [];
      const result = splitAtPoints(arr, [1, 2, 3]);

      expect(result).toEqual([[], [], [], []]);
    });

    it('should handle single element array', () => {
      const arr = [42];
      const result = splitAtPoints(arr, [0, 1]);

      expect(result).toEqual([[], [42], []]);
    });

    it('should handle array with one element and split at 1', () => {
      const arr = [42];
      const result = splitAtPoints(arr, [1]);

      expect(result).toEqual([[42], []]);
    });
  });

  describe('different data types', () => {
    it('should work with string arrays', () => {
      const arr = ['a', 'b', 'c', 'd', 'e'];
      const result = splitAtPoints(arr, [2, 4]);

      expect(result).toEqual([['a', 'b'], ['c', 'd'], ['e']]);
    });

    it('should work with mixed type arrays', () => {
      const arr = [1, 'two', 3, 'four', 5];
      const result = splitAtPoints(arr, [1, 3]);

      expect(result).toEqual([[1], ['two', 3], ['four', 5]]);
    });

    it('should work with object arrays', () => {
      const arr = [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
        { id: 4, name: 'David' },
      ];
      const result = splitAtPoints(arr, [2]);

      expect(result).toEqual([
        [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' },
        ],
        [
          { id: 3, name: 'Charlie' },
          { id: 4, name: 'David' },
        ],
      ]);
    });

    it('should work with nested arrays', () => {
      const arr = [
        [1, 2],
        [3, 4],
        [5, 6],
        [7, 8],
      ];
      const result = splitAtPoints(arr, [1, 3]);

      expect(result).toEqual([
        [[1, 2]],
        [
          [3, 4],
          [5, 6],
        ],
        [[7, 8]],
      ]);
    });
  });

  describe('complex scenarios', () => {
    it('should handle large array with many split points', () => {
      const arr = Array.from({ length: 100 }, (_, i) => i);
      const result = splitAtPoints(arr, [10, 25, 50, 75, 90]);

      expect(result).toHaveLength(6);
      expect(result[0]).toHaveLength(10);
      expect(result[1]).toHaveLength(15);
      expect(result[2]).toHaveLength(25);
      expect(result[3]).toHaveLength(25);
      expect(result[4]).toHaveLength(15);
      expect(result[5]).toHaveLength(10);
    });

    it('should handle points that would create empty segments', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = splitAtPoints(arr, [0, 1, 1, 2, 2, 3, 5]);

      expect(result).toEqual([[], [1], [], [2], [], [3], [4, 5], []]);
    });

    it('should maintain original array immutability', () => {
      const arr = [1, 2, 3, 4, 5];
      const original = [...arr];
      splitAtPoints(arr, [2, 4]);

      expect(arr).toEqual(original);
    });

    it('should handle floating point indices (truncated)', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = splitAtPoints(arr, [2.7, 4.1]);

      expect(result).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('performance and type safety', () => {
    it('should preserve type information', () => {
      const stringArr = ['a', 'b', 'c'];
      const stringResult = splitAtPoints(stringArr, [1]);

      // This test ensures TypeScript types are preserved
      const firstSegment: string[] = stringResult[0];
      expect(firstSegment).toEqual(['a']);
    });

    it('should handle very large split points array', () => {
      const arr = [1, 2, 3, 4, 5];
      const manyPoints = Array.from({ length: 1000 }, (_, i) => i % 6);
      const result = splitAtPoints(arr, manyPoints);

      // Should not throw and should handle gracefully
      expect(Array.isArray(result)).toBe(true);
      expect(result.flat()).toEqual(arr);
    });
  });
});
