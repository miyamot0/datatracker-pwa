import { z } from 'zod';
import { LogicState, OperationTypes } from '@/lib/logic';

/**
 * Keeps every entry that matches the item schema and drops the rest, so one bad entry does not reject a whole file.
 */
export function parseLenientList<T>(value: unknown, itemSchema: z.ZodType<T>): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items: T[] = [];

  for (const entry of value) {
    const parsed = itemSchema.safeParse(entry);

    if (parsed.success) {
      items.push(parsed.data);
    } else {
      console.warn('Skipping invalid entry in file', parsed.error.issues);
    }
  }

  return items;
}

export const KeySetInstanceSchema = z.looseObject({
  KeyName: z.string(),
  KeyDescription: z.string().catch(''),
  KeyCode: z.number(),
});

const ValueSourceSchema = z.union([
  z.looseObject({ type: z.literal('constant'), value: z.number() }),
  z.looseObject({ type: z.literal('field'), field: z.looseObject({}) }),
]);

const LogicalStepSchema = z.looseObject({
  id: z.string(),
  operation: z.enum(OperationTypes),
  operand: ValueSourceSchema,
});

// Matches the shape the logical dialog writes; unknown extra keys are kept.
export const LogicStateSchema: z.ZodType<LogicState> = z.looseObject({
  id: z.string(),
  name: z.string(),
  value: z.number(),
  initial: ValueSourceSchema,
  fields: z.array(z.looseObject({})),
  steps: z.array(LogicalStepSchema),
});
