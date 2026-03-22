import { KeyManageType } from '@/types/timing';
import { SessionDesignerSchemaType } from '@/components/pages/editor-session/views/session-designer-schema';
import { KeySet } from '@/types/keyset';
import { DataCollectorRolesType } from '@/types/roles';
import { SessionTerminationOptions, SessionTerminationOptionsType } from '@/types/terminations';

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

/**
 * This is the type definition for the SavedSessionResult type
 */
export type SavedSessionResult = {
  Keyset: KeySet;
  SessionSettings: SavedSettings;
  SystemKeyPresses: KeyManageType[];
  FrequencyKeyPresses: KeyManageType[];
  DurationKeyPresses: KeyManageType[];
  SessionStart: string;
  SessionEnd: string;
  EndedEarly: boolean;
  TimerMain: number;
  TimerOne: number;
  TimerTwo: number;
  TimerThree: number;
  SpecialKeyTimers: Record<string, number>;
  Filename?: string;
  Comments?: string;
};

/**
 * This is the type definition for the ExpandedSavedSessionResult type, which extends the SavedSessionResult type with additional properties used for plotting session outcomes
 */
export type ExpandedSavedSessionResult = SavedSessionResult & {
  Filename: string;
  MaxY: number;
  YTicks: number[];
  PlottedKeys: KeyManageType[];
};

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
