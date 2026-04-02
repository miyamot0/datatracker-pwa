import { KeySetLogical } from '@/types/keyset/serialization';

/**
 * Types for the logic engine
 */
export type ValueSourceConstant = { type: 'constant'; value: number };
export type ValueSourceField = { type: 'field'; field: KeySetLogical };
export type ValueSource = ValueSourceConstant | ValueSourceField;

/**
 * Operations (TODO: Need function application)
 */
export const OperationTypes = ['add', 'subtract', 'multiply', 'divide'] as const;

export type Operation = (typeof OperationTypes)[number];

export type LogicalStep = {
  // UUID
  id: string;

  // The operation to perform
  operation: Operation;

  // The value to use as the operand in the operation
  operand: ValueSource;
};

export type LogicState = {
  // The initial value for the logic engine
  // Example: Initial keyed value count
  initial: ValueSource;

  // Relevant fields for row
  fields: KeySetLogical[];

  // The sequence of steps to execute in the logic engine
  // Note: Linear logic system, branching not planned
  steps: LogicalStep[];

  // Result
  value: number;

  name: string;

  id: string;
};

export function generateFormula(logicState: LogicState) {
  const stringBuilderPre = logicState.steps.map((step) => {
    let operatorString = '';

    switch (step.operation) {
      case 'add':
        operatorString = ' += ';
        break;
      case 'subtract':
        operatorString = ' -= ';
        break;
      case 'multiply':
        operatorString = ' *= ';
        break;
      case 'divide':
        operatorString = ' /= ';
        break;
    }

    const operandStr =
      step.operand.type === 'constant' ? step.operand.value.toString() : step.operand.field.KeyDescription;
    return `${operatorString} ${operandStr}`;
  });

  return [
    logicState.initial.type === 'constant'
      ? logicState.initial.value.toString()
      : logicState.initial.field.KeyDescription,
    ...stringBuilderPre,
  ].join(' ');
}

function resolveValue(source: ValueSource, state: LogicState): number {
  if (source.type === 'constant') return source.value;

  const relevantKey = state.fields.find((f) => f.KeyCode === source.field.KeyCode);
  if (!relevantKey) throw new Error(`Field with KeyCode ${source.field.KeyCode} not found in state`);

  return relevantKey.Value;
}

function applyOp(a: number, b: number, op: Operation) {
  switch (op) {
    case 'add':
      return a + b;
    case 'subtract':
      return a - b;
    case 'multiply':
      return a * b;
    case 'divide':
      return b === 0 ? NaN : a / b;
  }
}

export function evaluateLogic(state: LogicState) {
  const newState = { ...state };
  const startValue = resolveValue(newState.initial, newState);

  newState.value = startValue;

  for (let step = 0; step < newState.steps.length; step++) {
    const currentStep = newState.steps[step];
    const operandValue = resolveValue(currentStep.operand, newState);
    newState.value = applyOp(newState.value, operandValue, currentStep.operation);
  }

  return newState.value;
}
