import '@/lib/zod-config';
import { z } from 'zod';

/**
 * Shared minimum length for a client name, used both by the de-identify schema and the create-flow validation below
 */
export const MIN_CLIENT_NAME_LENGTH = 4;

/**
 * A client's new name must not collide with any existing client in the current group
 */
export const buildDeIdentifySchema = (existingNames: string[]) =>
  z.object({
    NewName: z
      .string()
      .min(MIN_CLIENT_NAME_LENGTH, { message: 'The new name must be at least 4 characters long' })
      .max(128)
      .refine((name) => !existingNames.includes(name.trim()), {
        message: 'A client with this name already exists',
      }),
    ReplacementYear: z.coerce
      .number()
      .min(1970, { message: 'The year must be 1970 or later' })
      .max(2026, { message: 'The year must be 2026 or earlier' }),
    RedactComments: z.boolean().default(true),
  });

export type DeIdentifySchemaType = z.infer<ReturnType<typeof buildDeIdentifySchema>>;
