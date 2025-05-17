/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from 'zod';

/**
 * Get the values of an object
 *
 * @param obj object to get values from
 * @returns
 */
function getValues<T extends Record<string, any>>(obj: T) {
  return Object.values(obj) as [(typeof obj)[keyof T]];
}

// Roles for data collectors
export const DataCollectorRoles = {
  Primary: 'Primary',
  Reliability: 'Reliability',
} as const;

// Type for data collector roles
export type DataCollectorRolesType = (typeof DataCollectorRoles)[keyof typeof DataCollectorRoles];

// Session termination options
export const SessionTerminationOptions = {
  TimerMain: 'End on Primary Timer',
  Timer1: 'End on Timer #1',
  Timer2: 'End on Timer #2',
  Timer12: 'End on Timer #1 and #2 Total',
  Timer3: 'End on Timer #3',
} as const;

export const SessionTerminationOptionsDescriptions = [
  {
    value: SessionTerminationOptions.TimerMain,
    description: 'End on TOTAL Session Time (Independent of Active Timer)',
  },
  {
    value: SessionTerminationOptions.Timer1,
    description: 'End on Timer #1 Time Specifically (When Timer #1 > Duration)',
  },
  {
    value: SessionTerminationOptions.Timer2,
    description: 'End on Timer #2 Time Specifically (When Timer #2 > Duration)',
  },
  {
    value: SessionTerminationOptions.Timer12,
    description: 'End on Combined Duration of Timer #1/#2 (When Timer #1 + Timer #2 > Duration)',
  },
  {
    value: SessionTerminationOptions.Timer3,
    description: 'End on Timer #3 Time Specifically (When Timer #3 > Duration)',
  },
];

// Type for session termination options
export type SessionTerminationOptionsType = (typeof SessionTerminationOptions)[keyof typeof SessionTerminationOptions];

// Session designer schema
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

// Type for session designer schema
export type SessionDesignerSchemaType = z.infer<typeof SessionDesignerSchema>;
