import { get, set, type FieldErrors, type FieldValues, type Resolver } from 'react-hook-form';
import type { z } from 'zod';

/**
 * Minimal react-hook-form resolver for zod 4
 */
export function zodResolver<T extends FieldValues>(schema: z.ZodType<T>): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const errors: FieldErrors<T> = {};

    for (const issue of result.error.issues) {
      const name = issue.path.join('.');

      if (name && !get(errors, name)) {
        set(errors, name, { type: issue.code, message: issue.message });
      }
    }

    return { values: {}, errors };
  };
}
