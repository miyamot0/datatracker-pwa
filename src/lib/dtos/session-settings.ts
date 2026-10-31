import '@/lib/zod-config';
import { SessionDesignerSchemaType } from '@/components/pages/editor-session/session-designer-schema';
import { DataCollectorRoles, DataCollectorRolesType } from '@/types/roles';
import { SessionTerminationOptions, SessionTerminationOptionsType } from '@/types/terminations';
import { z } from 'zod';

/**
 * This is the type definition for the HumanReadableResults type
 */
export type SavedSettings = {
  Therapist: string;
  Condition: string;
  KeySet: string;
  TimerOption: SessionTerminationOptionsType | number;
  Initials: string;
  Role: DataCollectorRolesType;
  Session: number;
  DurationS: number;
};

/**
 * This is the default session settings object used when no settings are provided
 */
export const DEFAULT_SESSION_SETTINGS: SavedSettings = {
  Condition: '',
  TimerOption: 'End on Timer #1',
  Role: 'Primary',
  Initials: '',
  Session: 1,
  DurationS: 600,
  KeySet: '',
  Therapist: '',
};

const TimerOptionSchema = z
  .union([z.enum(Object.values(SessionTerminationOptions)), z.number()])
  .catch(DEFAULT_SESSION_SETTINGS.TimerOption as (typeof SessionTerminationOptions)[keyof typeof SessionTerminationOptions]);

/**
 * Lenient read of settings.json: each field falls back to its default on its own, and unknown keys are kept.
 */
export const SavedSettingsSchema = z.looseObject({
  Therapist: z.string().catch(DEFAULT_SESSION_SETTINGS.Therapist),
  Condition: z.string().catch(DEFAULT_SESSION_SETTINGS.Condition),
  KeySet: z.string().catch(DEFAULT_SESSION_SETTINGS.KeySet),
  TimerOption: TimerOptionSchema,
  Initials: z.string().catch(DEFAULT_SESSION_SETTINGS.Initials),
  Role: z.enum(Object.values(DataCollectorRoles)).catch(DEFAULT_SESSION_SETTINGS.Role),
  Session: z.number().catch(DEFAULT_SESSION_SETTINGS.Session),
  DurationS: z.number().catch(DEFAULT_SESSION_SETTINGS.DurationS),
});

/**
 * Convert the session designer schema to the saved settings type
 *
 * @param data session designer schema
 * @returns saved settings object
 */
export const toSavedSettings = (data: SessionDesignerSchemaType) => {
  const handleSpecialDurationOption = (option: string): SessionTerminationOptionsType | number => {
    if (option === 'End on Timer #1') {
      return SessionTerminationOptions.Timer1;
    } else if (option === 'End on Timer #2') {
      return SessionTerminationOptions.Timer2;
    } else if (option === 'End on Timer #3') {
      return SessionTerminationOptions.Timer3;
    } else if (option === 'End on Total Time') {
      return SessionTerminationOptions.TimerMain;
    } else if (option === 'End on Primary Timer') {
      return SessionTerminationOptions.TimerMain;
    } else {
      const doubleCode = parseInt(option);
      if (!isNaN(doubleCode)) {
        return doubleCode; // Return the custom option as-is if it's a valid number (representing a special key code)
      }

      throw new Error(`Invalid session termination option: ${option}`);
    }
  };

  return {
    Therapist: data.SessionTherapistID,
    Initials: data.DataCollectorID,
    Role: data.DataCollectorRole,
    DurationS: data.SessionDurationS,
    TimerOption: handleSpecialDurationOption(data.SessionTerminationOption),
    Session: Math.floor(data.SessionNumber),
    KeySet: data.SessionKeySet,
    Condition: data.SessionCondition,
  } satisfies SavedSettings;
};
