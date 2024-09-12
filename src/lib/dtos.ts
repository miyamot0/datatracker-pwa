import { KeyManageType } from "@/components/pages/session-recorder/types/session-recorder-types";
import {
  DataCollectorRolesType,
  SessionDesignerSchemaType,
  SessionTerminationOptionsType,
} from "@/forms/schema/session-designer-schema";
import { KeySet } from "@/types/keyset";

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

export const DEFAULT_SESSION_SETTINGS: SavedSettings = {
  Condition: "",
  TimerOption: "End on Primary Timer",
  Role: "Primary",
  Initials: "",
  Session: 1,
  DurationS: 600,
  KeySet: "",
  Therapist: "",
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
};

/**
 * Convert the session designer schema to the saved settings type
 *
 * @param data session designer schema
 * @returns saved settings
 */
export const toSavedSettings = (data: SessionDesignerSchemaType) => {
  return {
    Therapist: data.SessionTherapistID,
    Initials: data.DataCollectorID,
    Role: data.DataCollectorRole,
    DurationS: data.SessionDurationS,
    TimerOption: data.SessionTerminationOption,
    Session: data.SessionNumber,
    KeySet: data.SessionKeySet,
    Condition: data.SessionCondition,
  } satisfies SavedSettings;
};
