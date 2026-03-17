import { SessionTerminationOptionsType } from '@/types/terminations';
import { SavedSessionResult } from './dtos';
import { walkSessionDurationKey, walkSessionFrequencyKey } from './schedule-parser';
import { ToggleDisplayKey } from '@/types/visuals';
import { KeySetInstance } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';

export function filterSessionsByPrimaryRole(results: SavedSessionResult[]) {
  return results
    .filter((result) => result.SessionSettings.Role === 'Primary')
    .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session);
}

export function filterSessionsByReliabilityRole(results: SavedSessionResult[]) {
  return results
    .filter((result) => result.SessionSettings.Role === 'Reliability')
    .sort((a, b) => a.SessionSettings.Session - b.SessionSettings.Session);
}

export function getUniqueSessionConditions(results: SavedSessionResult[]) {
  return Array.from(new Set(results.map((result) => result.SessionSettings.Condition)));
}

export function generateTicks(maxTick: number, minTick: number) {
  return Array(maxTick + 1)
    .fill(0)
    .map((_, i) => {
      return i + minTick;
    });
}

export function generateChartPreparation(
  FilteredSessions: SavedSessionResult[],
  ScheduleOption: SessionTerminationOptionsType,
  Perspective: 'Frequency' | 'Duration',
) {
  const generateData = FilteredSessions.map((result) => {
    function convertScheduleSetting(schedule: SessionTerminationOptionsType) {
      switch (schedule) {
        case 'End on Timer #1':
          return 'Primary';
        case 'End on Timer #2':
          return 'Secondary';
        case 'End on Timer #3':
          return 'Tertiary';
        default:
          throw Error('Invalid Schedule Option');
      }
    }

    function pullSessionTime(session: SavedSessionResult, schedule: SessionTerminationOptionsType) {
      switch (schedule) {
        case 'End on Timer #1':
          return session.TimerOne;
        case 'End on Timer #2':
          return session.TimerTwo;
        case 'End on Timer #3':
          return session.TimerThree;
        case 'End on Primary Timer':
          return session.TimerMain;
        default:
          throw Error('Invalid Schedule Option');
      }
    }

    const scores =
      Perspective === 'Frequency'
        ? result.Keyset.FrequencyKeys.map((key) => {
            return walkSessionFrequencyKey(result, convertScheduleSetting(ScheduleOption), key);
          })
        : result.Keyset.DurationKeys.map((key) => {
            return walkSessionDurationKey(result, convertScheduleSetting(ScheduleOption), key);
          });

    return {
      Session: result.SessionSettings.Session,
      SessionSettings: result.SessionSettings,
      Condition: result.SessionSettings.Condition,
      FrequencyKeyPresses: result.FrequencyKeyPresses,
      DurationKeyPresses: result.DurationKeyPresses,
      Schedule: ScheduleOption,
      SessionTime: pullSessionTime(result, ScheduleOption),
      Scores: scores,
    };
  });

  return generateData;
}

/**
 * Extracts and deduplicates keysets from session results to create a dynamic keyset for visualization
 * @param results - Array of session results containing keysets
 * @returns An object containing deduplicated frequency and duration keys for use in visualizations
 */
export function extractAndDeduplicateKeysets(results: ModifiedSessionResult[]) {
  const allKeysets = results.map((result) => result.Keyset);
  const allFKeys = allKeysets.map((keyset) => keyset.FrequencyKeys).flat();
  const allDKeys = allKeysets.map((keyset) => keyset.DurationKeys).flat();

  const targetedFKeys: KeySetInstance[] = [];
  allFKeys.forEach((key) => {
    if (!targetedFKeys.some((k) => k.KeyCode === key.KeyCode)) {
      targetedFKeys.push(key);
    }
  });

  const targetedDKeys: KeySetInstance[] = [];
  allDKeys.forEach((key) => {
    if (!targetedDKeys.some((k) => k.KeyCode === key.KeyCode)) {
      targetedDKeys.push(key);
    }
  });

  return {
    frequencyKeys: targetedFKeys,
    durationKeys: targetedDKeys,
  };
}

/**
 * Maps keys with their storage preference visibility based on stored preferences
 */
export function mapKeysWithStoragePreference(keys: ToggleDisplayKey[], storedPreferences: any) {
  return keys.map((key) => {
    const shouldDisable = storedPreferences.KeyDescription.includes(key.KeyDescription);

    if (shouldDisable) {
      return {
        ...key,
        Visible: false,
      };
    }

    return key;
  });
}

/**
 * Creates CTB key with preferences and handling for exclusions
 */
export function createCTBKeyWithPreferences(keys: ToggleDisplayKey[], storedPreferences: any) {
  const ctbEntry = {
    KeyDescription: 'CTB',
    Visible: true,
  };

  // Map CTB exclusions
  const excludeFromCTB = keys.map((key) => {
    const shouldDisable = storedPreferences.CTBElements.includes(key.KeyDescription);

    if (shouldDisable) {
      return {
        ...key,
        Visible: false,
      };
    }

    return key;
  });

  return {
    ctbEntry,
    excludeFromCTB,
  };
}
