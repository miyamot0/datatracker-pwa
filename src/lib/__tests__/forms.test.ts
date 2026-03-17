import { describe, it, expect } from 'vitest';
import { getValues } from '../forms';

describe('forms.ts', () => {
  describe('getValues', () => {
    it('should return values from a simple object with strings', () => {
      const obj = {
        name: 'John',
        city: 'New York',
        country: 'USA',
      };

      const result = getValues(obj);

      expect(result).toEqual(['John', 'New York', 'USA']);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(3);
    });

    it('should return values from an object with mixed data types', () => {
      const obj = {
        name: 'Alice',
        age: 30,
        isActive: true,
        score: null,
        description: undefined,
      };

      const result = getValues(obj);

      expect(result).toEqual(['Alice', 30, true, null, undefined]);
      expect(result).toHaveLength(5);
    });

    it('should return values from an object with numbers', () => {
      const obj = {
        one: 1,
        two: 2,
        three: 3,
        pi: 3.14159,
        negative: -42,
      };

      const result = getValues(obj);

      expect(result).toEqual([1, 2, 3, 3.14159, -42]);
      expect(result).toHaveLength(5);
    });

    it('should return values from an object with boolean values', () => {
      const obj = {
        isTrue: true,
        isFalse: false,
        isEnabled: true,
        isDisabled: false,
      };

      const result = getValues(obj);

      expect(result).toEqual([true, false, true, false]);
      expect(result).toHaveLength(4);
    });

    it('should return empty array for empty object', () => {
      const obj = {};

      const result = getValues(obj);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle objects with special string keys', () => {
      const obj = {
        'key with spaces': 'value1',
        'key-with-dashes': 'value2',
        key_with_underscores: 'value3',
        keyWithNumbers123: 'value4',
      };

      const result = getValues(obj);

      expect(result).toEqual(['value1', 'value2', 'value3', 'value4']);
      expect(result).toHaveLength(4);
    });

    it('should handle objects with null and undefined values', () => {
      const obj = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zero: 0,
        falseBool: false,
      };

      const result = getValues(obj);

      expect(result).toEqual([null, undefined, '', 0, false]);
      expect(result).toHaveLength(5);
    });

    it('should maintain order of object properties', () => {
      const obj = {
        first: 'A',
        second: 'B',
        third: 'C',
        fourth: 'D',
        fifth: 'E',
      };

      const result = getValues(obj);

      // Object.values() maintains insertion order for string keys
      expect(result).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('should handle single property objects', () => {
      const obj = {
        singleProp: 'single value',
      };

      const result = getValues(obj);

      expect(result).toEqual(['single value']);
      expect(result).toHaveLength(1);
    });

    it('should handle objects with numeric-like string keys', () => {
      const obj = {
        '0': 'zero',
        '1': 'one',
        '10': 'ten',
        regular: 'normal key',
      };

      const result = getValues(obj);

      // Should maintain all values regardless of key format
      expect(result).toHaveLength(4);
      expect(result).toContain('zero');
      expect(result).toContain('one');
      expect(result).toContain('ten');
      expect(result).toContain('normal key');
    });

    it('should be equivalent to Object.values for all test cases', () => {
      const testObjects = [
        { a: 1, b: 2, c: 3 },
        { name: 'test', active: true },
        {},
        { single: 'value' },
        { nested: { deep: 'value' }, array: [1, 2] },
      ];

      testObjects.forEach((obj) => {
        const getValuesResult = getValues(obj);
        const objectValuesResult = Object.values(obj);

        expect(getValuesResult).toEqual(objectValuesResult);
      });
    });
  });
});
