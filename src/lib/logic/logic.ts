import { KeySetLogical } from '@/types/keyset';

/**
 * Types for the logic engine
 */
type ValueSourceConstant = { type: 'constant'; value: number };
type ValueSourceField = { type: 'field'; field: KeySetLogical };
type ValueSource = ValueSourceConstant | ValueSourceField;

/**
 * Operations (TODO: Need function application)
 */
type Operation = 'add' | 'subtract' | 'multiply' | 'divide';

type Step = {
  // UUID
  id: string;

  // The operation to perform
  operation: Operation;

  // The value to use as the operand in the operation
  operand: ValueSource;
};

type LogicState = {
  // The initial value for the logic engine
  // Example: Initial keyed value count
  initial: ValueSource;

  // Relevant fields for row
  fields: KeySetLogical[];

  // The sequence of steps to execute in the logic engine
  // Note: Linear logic system, branching not planned
  steps: Step[];

  // Result
  value: number;
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
  const startValue = resolveValue(state.initial, state);

  console.log('Initial value:', startValue);

  state.value = startValue;

  for (let step = 0; step < state.steps.length; step++) {
    const currentStep = state.steps[step];

    const operandValue = resolveValue(currentStep.operand, state);

    state.value = applyOp(state.value, operandValue, currentStep.operation);

    console.log(`Step ${step + 1} (${currentStep.operation} ${operandValue}): ${state.value}`);
  }

  console.log('Final value:', state.value);
}

export function getRelevantFieldValues() {
  const field1 = {
    KeyName: 'a',
    KeyDescription: 'Description for a',
    KeyCode: 65,
    Value: 5,
  } as KeySetLogical;

  const field2 = {
    KeyName: 'b',
    KeyDescription: 'Description for b',
    KeyCode: 66,
    Value: 10,
  } as KeySetLogical;

  const field3 = {
    KeyName: 'r',
    KeyDescription: 'Description for r (duration key)',
    KeyCode: 82,
    Value: 30,
  } as KeySetLogical;

  return [field1, field2, field3];
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
    } as Step,
    {
      id: 'step2',
      operation: 'add',
      operand: {
        type: 'field',
        field: field2,
      } as ValueSourceField,
    } as Step,
    {
      id: 'step3',
      operation: 'divide',
      operand: {
        type: 'field',
        field: field3,
      } as ValueSourceField,
    } as Step,
    {
      id: 'step4',
      operation: 'multiply',
      operand: {
        type: 'constant',
        value: 60,
      } as ValueSourceConstant,
    } as Step,
  ];
}

export function testLogic() {
  // Note: Common across ALL rules
  const fields = getRelevantFieldValues();

  // Note: Specific to SINGLE rule
  const steps = getLogicalSteps();

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
}
