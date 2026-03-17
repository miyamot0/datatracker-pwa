import { getValues } from '@/lib/forms';
import { DataCollectorRoles } from '@/types/roles';
import { SessionTerminationOptions } from '@/types/terminations';
import { z } from 'zod';

export const SessionDesignerSchema = z.object({
  DataCollectorID: z.string().min(2, { message: 'You must provide at least initials (e.g., AB)' }).max(128),
  DataCollectorRole: z.enum(getValues(DataCollectorRoles)),
  SessionCondition: z
    .string()
    .min(2, { message: 'You must specify a condition (You may need to create one)' })
    .max(128),
  SessionTherapistID: z.string().min(2, { message: 'You must provide at least initials (e.g., AB)' }).max(128),
  SessionDurationS: z.coerce
    .number()
    .min(10)
    .max(3600 * 24),
  SessionTerminationOption: z.enum(getValues(SessionTerminationOptions)),
  SessionNumber: z.coerce.number().min(1, { message: 'The session number must be greater than 0' }),
  SessionKeySet: z.string().min(1, { message: 'You must specify a KeySet (You may need to create one)' }),
});

export type SessionDesignerSchemaType = z.infer<typeof SessionDesignerSchema>;
