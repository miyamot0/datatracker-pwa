import { KeyManageType } from '@/types/timing';
import { SessionDesignerSchemaType } from '@/components/pages/editor-session/views/session-designer-schema';
import { KeySet } from '@/types/keyset';
import { DataCollectorRolesType } from '@/types/roles';
import { SessionTerminationOptionsType } from '@/types/terminations';

/**
 * This is the type definition for the HumanReadableResults type
 */
export type SavedSettings = {
  Therapist: string;
  Condition: string;
  KeySet: string;
  TimerOption: SessionTerminationOptionsType;
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
  return {
    Therapist: data.SessionTherapistID,
    Initials: data.DataCollectorID,
    Role: data.DataCollectorRole,
    DurationS: data.SessionDurationS,
    TimerOption: data.SessionTerminationOption,
    Session: Math.floor(data.SessionNumber),
    KeySet: data.SessionKeySet,
    Condition: data.SessionCondition,
  } satisfies SavedSettings;
};
