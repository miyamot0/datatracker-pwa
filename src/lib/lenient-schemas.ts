import { z } from 'zod';

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

// Logic entries are checked only for being objects; the logic engine validates their contents.
export const LogicEntrySchema = z.looseObject({});
