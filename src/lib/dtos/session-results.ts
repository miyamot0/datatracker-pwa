import { KeyManageType } from '@/types/timing';
import { KeySet } from '@/types/keyset';
import { SavedSettings } from './session-settings';

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