import { describe, expect, it } from 'vitest';
import { KeySetLogical } from '@/types/keyset/serialization';
import { type LogicState, OperationTypes, generateFormula, evaluateLogic } from '@/lib/logic';

// Helper function to create mock KeySetLogical
const createMockKey = (keyCode: number, value: number, description: string): KeySetLogical => ({
  KeyName: description,
  KeyCode: keyCode,
  KeyDescription: description,
  Value: value,
  Tag: '',
});

describe('Logic Engine', () => {
  describe('Types and Constants', () => {
    it('should have correct operation types', () => {
      expect(OperationTypes).toEqual(['add', 'subtract', 'multiply', 'divide']);
      expect(OperationTypes).toHaveLength(4);
    });
  });

  describe('generateFormula', () => {
    it('should generate formula with constant initial value and constant operands', () => {
      const state: LogicState = {
        initial: { type: 'constant', value: 10 },
        fields: [],
        steps: [
          {
            id: '1',
            operation: 'add',
            operand: { type: 'constant', value: 5 },
          },
          {
            id: '2',
            operation: 'multiply',
            operand: { type: 'constant', value: 2 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const formula = generateFormula(state);
      expect(formula).toBe('10  +=  5  *=  2');
    });

    it('should generate formula with field initial value and field operands', () => {
      const mockKey1 = createMockKey(1, 10, 'First Key');
      const mockKey2 = createMockKey(2, 5, 'Second Key');

      const state: LogicState = {
        initial: { type: 'field', field: mockKey1 },
        fields: [mockKey1, mockKey2],
        steps: [
          {
            id: '1',
            operation: 'subtract',
            operand: { type: 'field', field: mockKey2 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const formula = generateFormula(state);
      expect(formula).toBe('First Key  -=  Second Key');
    });

    it('should generate formula with mixed constant and field values', () => {
      const mockKey = createMockKey(1, 10, 'Test Key');

      const state: LogicState = {
        initial: { type: 'constant', value: 100 },
        fields: [mockKey],
        steps: [
          {
            id: '1',
            operation: 'divide',
            operand: { type: 'field', field: mockKey },
          },
          {
            id: '2',
            operation: 'add',
            operand: { type: 'constant', value: 25 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const formula = generateFormula(state);
      expect(formula).toBe('100  /=  Test Key  +=  25');
    });

    it('should generate formula with all four operations', () => {
      const state: LogicState = {
        initial: { type: 'constant', value: 10 },
        fields: [],
        steps: [
          {
            id: '1',
            operation: 'add',
            operand: { type: 'constant', value: 5 },
          },
          {
            id: '2',
            operation: 'subtract',
            operand: { type: 'constant', value: 3 },
          },
          {
            id: '3',
            operation: 'multiply',
            operand: { type: 'constant', value: 2 },
          },
          {
            id: '4',
            operation: 'divide',
            operand: { type: 'constant', value: 4 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const formula = generateFormula(state);
      expect(formula).toBe('10  +=  5  -=  3  *=  2  /=  4');
    });

    it('should generate formula with no steps', () => {
      const state: LogicState = {
        initial: { type: 'constant', value: 42 },
        fields: [],
        steps: [],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const formula = generateFormula(state);
      expect(formula).toBe('42');
    });
  });

  describe('evaluateLogic', () => {
    it('should evaluate simple constant arithmetic', () => {
      const state: LogicState = {
        initial: { type: 'constant', value: 10 },
        fields: [],
        steps: [
          {
            id: '1',
            operation: 'add',
            operand: { type: 'constant', value: 5 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const result = evaluateLogic(state);
      expect(result).toBe(15);
    });

    it('should evaluate with field values', () => {
      const mockKey1 = createMockKey(1, 20, 'First Key');
      const mockKey2 = createMockKey(2, 4, 'Second Key');

      const state: LogicState = {
        initial: { type: 'field', field: mockKey1 },
        fields: [mockKey1, mockKey2],
        steps: [
          {
            id: '1',
            operation: 'divide',
            operand: { type: 'field', field: mockKey2 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const result = evaluateLogic(state);
      expect(result).toBe(5);
    });

    it('should evaluate complex multi-step logic', () => {
      const mockKey = createMockKey(1, 2, 'Multiplier Key');

      const state: LogicState = {
        initial: { type: 'constant', value: 10 },
        fields: [mockKey],
        steps: [
          {
            id: '1',
            operation: 'add',
            operand: { type: 'constant', value: 5 },
          },
          {
            id: '2',
            operation: 'multiply',
            operand: { type: 'field', field: mockKey },
          },
          {
            id: '3',
            operation: 'subtract',
            operand: { type: 'constant', value: 10 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      // (10 + 5) * 2 - 10 = 15 * 2 - 10 = 30 - 10 = 20
      const result = evaluateLogic(state);
      expect(result).toBe(20);
    });

    it('should handle all four operations correctly', () => {
      const state: LogicState = {
        initial: { type: 'constant', value: 100 },
        fields: [],
        steps: [
          {
            id: '1',
            operation: 'add',
            operand: { type: 'constant', value: 20 },
          },
          {
            id: '2',
            operation: 'subtract',
            operand: { type: 'constant', value: 20 },
          },
          {
            id: '3',
            operation: 'multiply',
            operand: { type: 'constant', value: 2 },
          },
          {
            id: '4',
            operation: 'divide',
            operand: { type: 'constant', value: 4 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      // 100 + 20 - 20 * 2 / 4 = 120 - 20 * 2 / 4 = 100 * 2 / 4 = 200 / 4 = 50
      const result = evaluateLogic(state);
      expect(result).toBe(50);
    });

    it('should handle division by zero', () => {
      const state: LogicState = {
        initial: { type: 'constant', value: 10 },
        fields: [],
        steps: [
          {
            id: '1',
            operation: 'divide',
            operand: { type: 'constant', value: 0 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const result = evaluateLogic(state);
      expect(result).toBe(NaN);
    });

    it('should handle zero initial value', () => {
      const state: LogicState = {
        initial: { type: 'constant', value: 0 },
        fields: [],
        steps: [
          {
            id: '1',
            operation: 'add',
            operand: { type: 'constant', value: 5 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const result = evaluateLogic(state);
      expect(result).toBe(5);
    });

    it('should handle negative values', () => {
      const state: LogicState = {
        initial: { type: 'constant', value: 10 },
        fields: [],
        steps: [
          {
            id: '1',
            operation: 'subtract',
            operand: { type: 'constant', value: 15 },
          },
          {
            id: '2',
            operation: 'multiply',
            operand: { type: 'constant', value: -2 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      // 10 - 15 = -5, -5 * -2 = 10
      const result = evaluateLogic(state);
      expect(result).toBe(10);
    });

    it('should handle floating point numbers', () => {
      const mockKey = createMockKey(1, 2.5, 'Decimal Key');

      const state: LogicState = {
        initial: { type: 'constant', value: 10.5 },
        fields: [mockKey],
        steps: [
          {
            id: '1',
            operation: 'multiply',
            operand: { type: 'field', field: mockKey },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const result = evaluateLogic(state);
      expect(result).toBeCloseTo(26.25);
    });

    it('should handle empty steps array', () => {
      const mockKey = createMockKey(1, 42, 'Test Key');

      const state: LogicState = {
        initial: { type: 'field', field: mockKey },
        fields: [mockKey],
        steps: [],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const result = evaluateLogic(state);
      expect(result).toBe(42);
    });

    it('should throw error for missing field in initial value', () => {
      const mockKey = createMockKey(1, 10, 'Test Key');
      const missingKey = createMockKey(undefined as unknown as number, 0, 'Missing Key');

      const state: LogicState = {
        initial: { type: 'field', field: missingKey },
        fields: [mockKey], // missingKey is not in fields
        steps: [],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      expect(() => evaluateLogic(state)).toThrow('Field with KeyCode undefined not found in state');
    });

    it('should throw error for missing field in operand', () => {
      const mockKey = createMockKey(1, 10, 'Test Key');
      const missingKey = createMockKey(undefined as unknown as number, 0, 'Missing Key');

      const state: LogicState = {
        initial: { type: 'constant', value: 10 },
        fields: [mockKey], // missingKey is not in fields
        steps: [
          {
            id: '1',
            operation: 'add',
            operand: { type: 'field', field: missingKey },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      expect(() => evaluateLogic(state)).toThrow('Field with KeyCode undefined not found in state');
    });

    it('should handle multiple fields correctly', () => {
      const key1 = createMockKey(1, 10, 'First Key');
      const key2 = createMockKey(2, 5, 'Second Key');
      const key3 = createMockKey(3, 2, 'Third Key');

      const state: LogicState = {
        initial: { type: 'field', field: key1 },
        fields: [key1, key2, key3],
        steps: [
          {
            id: '1',
            operation: 'add',
            operand: { type: 'field', field: key2 },
          },
          {
            id: '2',
            operation: 'multiply',
            operand: { type: 'field', field: key3 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      // 10 + 5 = 15, 15 * 2 = 30
      const result = evaluateLogic(state);
      expect(result).toBe(30);
    });

    it('should preserve original state immutably', () => {
      const originalState: LogicState = {
        initial: { type: 'constant', value: 10 },
        fields: [],
        steps: [
          {
            id: '1',
            operation: 'add',
            operand: { type: 'constant', value: 5 },
          },
        ],
        value: 999, // Original value
        name: 'test',
        id: 'test-id',
      };

      const result = evaluateLogic(originalState);

      expect(result).toBe(15);
      expect(originalState.value).toBe(999); // Original state should be unchanged
    });

    it('should handle very large numbers', () => {
      const state: LogicState = {
        initial: { type: 'constant', value: 1000000 },
        fields: [],
        steps: [
          {
            id: '1',
            operation: 'multiply',
            operand: { type: 'constant', value: 1000 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const result = evaluateLogic(state);
      expect(result).toBe(1000000000);
    });

    it('should handle precision for division operations', () => {
      const state: LogicState = {
        initial: { type: 'constant', value: 10 },
        fields: [],
        steps: [
          {
            id: '1',
            operation: 'divide',
            operand: { type: 'constant', value: 3 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const result = evaluateLogic(state);
      expect(result).toBeCloseTo(3.3333333333333335);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle field with zero value in division', () => {
      const zeroKey = createMockKey(0, 0, 'Zero Key');

      const state: LogicState = {
        initial: { type: 'constant', value: 10 },
        fields: [zeroKey],
        steps: [
          {
            id: '1',
            operation: 'divide',
            operand: { type: 'field', field: zeroKey },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const result = evaluateLogic(state);
      expect(result).toBe(NaN);
    });

    it('should handle operations resulting in infinity', () => {
      const state: LogicState = {
        initial: { type: 'constant', value: Number.MAX_VALUE },
        fields: [],
        steps: [
          {
            id: '1',
            operation: 'multiply',
            operand: { type: 'constant', value: 2 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const result = evaluateLogic(state);
      expect(result).toBe(Infinity);
    });

    it('should handle operations with NaN', () => {
      const state: LogicState = {
        initial: { type: 'constant', value: NaN },
        fields: [],
        steps: [
          {
            id: '1',
            operation: 'add',
            operand: { type: 'constant', value: 5 },
          },
        ],
        value: 0,
        name: 'test',
        id: 'test-id',
      };

      const result = evaluateLogic(state);
      expect(result).toBe(NaN);
    });
  });
});
