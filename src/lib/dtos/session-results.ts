import { z } from 'zod';
import { KeyManageType } from '@/types/timing';
import { KeySet } from '@/types/keyset/core';
import { SavedSettings } from './session-settings';
import { parseLenientList } from '@/lib/lenient-schemas';

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

const KeyPressSchema = z.looseObject({
  KeyName: z.string(),
  KeyCode: z.number(),
});

// Session is the session number used for ordering; it has no safe fallback, so a non-number rejects the file.
// Keyset contents are checked by the keyset reader. Other fields fall back to a neutral value on their own,
// so one bad field does not discard the session.
const SavedSessionResultSchema = z.looseObject({
  SessionSettings: z.looseObject({ Session: z.number() }),
  Keyset: z.looseObject({}),
  SystemKeyPresses: z.unknown(),
  FrequencyKeyPresses: z.unknown(),
  DurationKeyPresses: z.unknown(),
  SessionStart: z.string().catch(''),
  SessionEnd: z.string().catch(''),
  EndedEarly: z.boolean().catch(false),
  TimerMain: z.number().catch(0),
  TimerOne: z.number().catch(0),
  TimerTwo: z.number().catch(0),
  TimerThree: z.number().catch(0),
  SpecialKeyTimers: z.record(z.string(), z.number()).catch({}),
  Comments: z.string().optional(),
});

/**
 * Validate a parsed session result file. Returns null when the file is not usable.
 * Malformed key press entries are dropped individually.
 *
 * @param value the parsed JSON of a session result file
 * @returns the validated session result, or null if the file is not usable
 */
export function parseSavedSessionResult(value: unknown): SavedSessionResult | null {
  const parsed = SavedSessionResultSchema.safeParse(value);

  if (!parsed.success) {
    return null;
  }

  const data = parsed.data;

  // Key press entries are checked against KeyPressSchema; the remaining fields keep the types validated above.
  return {
    ...data,
    SystemKeyPresses: parseLenientList(data.SystemKeyPresses, KeyPressSchema) as KeyManageType[],
    FrequencyKeyPresses: parseLenientList(data.FrequencyKeyPresses, KeyPressSchema) as KeyManageType[],
    DurationKeyPresses: parseLenientList(data.DurationKeyPresses, KeyPressSchema) as KeyManageType[],
    SessionSettings: data.SessionSettings as SavedSettings,
    Keyset: data.Keyset as KeySet,
  } as SavedSessionResult;
}

/**
 * This is the type definition for the ExpandedSavedSessionResult type, which extends the SavedSessionResult type with additional properties used for plotting session outcomes
 */
export type ExpandedSavedSessionResult = SavedSessionResult & {
  Filename: string;
  MaxY: number;
  YTicks: number[];
  PlottedKeys: KeyManageType[];
};
