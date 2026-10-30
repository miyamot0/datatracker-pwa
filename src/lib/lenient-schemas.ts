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

/**
 * Like parseLenientList, but keeps entries that fail the schema as-is (with a warning) instead of dropping them.
 * Use where the file is rewritten on save, so unmatched entries are not deleted from the user's data.
 * Callers must handle the unmatched entries, which are not guaranteed to match T.
 */
export function parseKeepingUnmatchedList<T>(value: unknown, itemSchema: z.ZodType<T>): T[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((entry) => {
    const parsed = itemSchema.safeParse(entry);

    if (parsed.success) {
      return parsed.data;
    }

    console.warn('Keeping entry that does not match the expected shape', parsed.error.issues);
    return entry as T;
  });
}

export const KeySetInstanceSchema = z.looseObject({
  KeyName: z.string(),
  KeyDescription: z.string().catch(''),
  KeyCode: z.number(),
});

// A key entry as stored inside DerivedKeys (see KeySetLogical), including the computed Value and Tag.
const KeySetLogicalSchema = KeySetInstanceSchema.extend({
  Value: z.number(),
  Tag: z.string(),
});

const ValueSourceSchema = z.union([
  z.looseObject({ type: z.literal('constant'), value: z.number() }),
  z.looseObject({ type: z.literal('field'), field: KeySetLogicalSchema }),
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
  fields: z.array(KeySetLogicalSchema),
  steps: z.array(LogicalStepSchema),
});
