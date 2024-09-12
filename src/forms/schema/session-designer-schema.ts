"use client";

import { z } from "zod";

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
  Primary: "Primary",
  Reliability: "Reliability",
} as const;

// Type for data collector roles
export type DataCollectorRolesType =
  (typeof DataCollectorRoles)[keyof typeof DataCollectorRoles];

// Session termination options
export const SessionTerminationOptions = {
  TimerMain: "End on Primary Timer",
  Timer1: "End on Timer #1",
  Timer2: "End on Timer #2",
  Timer3: "End on Timer #3",
} as const;

// Type for session termination options
export type SessionTerminationOptionsType =
  (typeof SessionTerminationOptions)[keyof typeof SessionTerminationOptions];

// Session designer schema
export const SessionDesignerSchema = z.object({
  DataCollectorID: z.string().min(2).max(128),
  DataCollectorRole: z.enum(getValues(DataCollectorRoles)),
  SessionCondition: z.string().min(2).max(128),
  SessionTherapistID: z.string().min(2).max(128),
  SessionDurationS: z.coerce.number().min(10).max(3600),
  SessionTerminationOption: z.enum(getValues(SessionTerminationOptions)),
  SessionNumber: z.coerce.number().min(1),
  SessionKeySet: z.string().min(1),
});

// Type for session designer schema
export type SessionDesignerSchemaType = z.infer<typeof SessionDesignerSchema>;
