import { KeySetLogical } from '@/types/keyset';

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

export function evaluate(state: LogicState) {
  const newState = { ...state };
  const startValue = resolveValue(newState.initial, newState);

  //console.log('Initial value:', startValue);

  newState.value = startValue;

  for (let step = 0; step < newState.steps.length; step++) {
    const currentStep = newState.steps[step];

    const operandValue = resolveValue(currentStep.operand, newState);

    newState.value = applyOp(newState.value, operandValue, currentStep.operation);

    console.log(`Step ${step + 1} (${currentStep.operation} ${operandValue}): ${newState.value}`);
  }

  console.log('Final value:', newState.value);

  return newState.value;
}

export function getRelevantFieldValues() {
  const field1 = {
    KeyName: 'a',
    KeyDescription: 'SIB',
    KeyCode: 65,
    Value: 1,
    Tag: 'field.SIB',
  } as KeySetLogical;

  const field2 = {
    KeyName: 'b',
    KeyDescription: 'AGG',
    KeyCode: 66,
    Value: 2,
    Tag: 'field.AGG',
  } as KeySetLogical;

  const field3 = {
    KeyName: 'r',
    KeyDescription: 'DIS',
    KeyCode: 82,
    Value: 3,
    Tag: 'field.DIS',
  } as KeySetLogical;

  const fielda = {
    KeyName: 'TimerOne',
    KeyDescription: 'Timer #1 Seconds',
    KeyCode: -1,
    Value: 30,
    Tag: 'field.TimerOne',
  } as KeySetLogical;

  const fieldb = {
    KeyName: 'TimerTwo',
    KeyDescription: 'Timer #2 Seconds',
    KeyCode: -2,
    Value: 0,
    Tag: 'field.TimerTwo',
  } as KeySetLogical;

  const fieldc = {
    KeyName: 'TimerThree',
    KeyDescription: 'Timer #3 Seconds',
    KeyCode: -3,
    Value: 0,
    Tag: 'field.TimerThree',
  } as KeySetLogical;

  return [field1, field2, field3, fielda, fieldb, fieldc];
}

export function getLogicalSteps() {
  // TODO: hacky for now
  const [field1, field2, field3] = getRelevantFieldValues();

  return [
    {
      id: 'step1',
      operation: 'add',
      operand: {
        type: 'field',
        field: field1,
      } as ValueSourceField,
    } as LogicalStep,
    {
      id: 'step2',
      operation: 'add',
      operand: {
        type: 'field',
        field: field2,
      } as ValueSourceField,
    } as LogicalStep,
    {
      id: 'step3',
      operation: 'divide',
      operand: {
        type: 'field',
        field: field3,
      } as ValueSourceField,
    } as LogicalStep,
    {
      id: 'step4',
      operation: 'multiply',
      operand: {
        type: 'constant',
        value: 60,
      } as ValueSourceConstant,
    } as LogicalStep,
  ];
}

export function testLogic() {
  // Note: Common across ALL rules
  const fields = getRelevantFieldValues();

  // Note: Specific to SINGLE rule
  const steps = getLogicalSteps();

  /*
  const initialStateConstant = {
    initial: { type: 'constant', value: 0 },
    steps: steps,
    fields: fields,
    value: 0,
  } satisfies LogicState;

  console.log('Evaluating logic with initial state constant:');
  evaluate(initialStateConstant);

  const initialStateField = {
    initial: { type: 'field', field: fields[0] },
    steps: steps,
    fields: fields,
    value: 0,
  } satisfies LogicState;

  console.log('Evaluating logic with initial state field:');
  evaluate(initialStateField);
  */
}
