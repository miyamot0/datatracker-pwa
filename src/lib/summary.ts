import { getLocalCachedPrefs } from '@/lib/local_storage';
import { EnhancedKeySetInstance } from '@/types/keyset';
import { ScheduleMappingOptions } from '@/types/schedules';
import { KeySet } from '@/types/keyset';

export function prepareDataOrganization(Group: string, Individual: string, Evaluation: string, KeySet: KeySet) {
  // Note: All visible by default, then apply user preferences to hide keys as needed
  const enhancedKeySetF: EnhancedKeySetInstance[] = KeySet.FrequencyKeys.map((key) => ({
    ...key,
    Visible: true,
    Type: 'Key',
  }));
  const enhancedKeySetD: EnhancedKeySetInstance[] = KeySet.DurationKeys.map((key) => ({
    ...key,
    Visible: true,
    Type: 'Key',
  }));
  const ctbEntry = {
    KeyCode: -1,
    KeyDescription: 'CTB',
    KeyName: 'CTB',
    Visible: true,
    Type: 'Summary',
  } satisfies EnhancedKeySetInstance;

  // Pull stored preferences for both frequency and duration keys
  const stored_prefs_F = getLocalCachedPrefs(Group, Individual, Evaluation, 'Rate');
  const stored_prefs_D = getLocalCachedPrefs(Group, Individual, Evaluation, 'Duration');

  // Conditionally set these to false based on user preferences for both frequency and duration keys
  const baseUnfilteredKeysF = [...enhancedKeySetF, ctbEntry].map((key) => {
    const should_disable = stored_prefs_F.KeyDescription.includes(key.KeyDescription);

    if (should_disable) {
      return {
        ...key,
        Visible: false,
      } satisfies EnhancedKeySetInstance;
    }

    return key;
  });
  const baseUnfilteredKeysD = enhancedKeySetD.map((key) => {
    const should_disable = stored_prefs_D.KeyDescription.includes(key.KeyDescription);

    if (should_disable) {
      return {
        ...key,
        Visible: false,
      } satisfies EnhancedKeySetInstance;
    }

    return key;
  });

  // Note: Helper function for CTB
  const excludeFromCTB = baseUnfilteredKeysF.map((key) => {
    const should_disable = stored_prefs_F.CTBElements.includes(key.KeyDescription);
    if (should_disable) {
      return {
        ...key,
        Visible: false,
      } satisfies EnhancedKeySetInstance;
    }

    return key;
  });

  const timerMapping =
    ScheduleMappingOptions.find((i) => i.value === stored_prefs_F?.Schedule) ?? ScheduleMappingOptions[0];

  return {
    UnfilteredKeysFrequency: baseUnfilteredKeysF,
    UnfilteredKeysDuration: baseUnfilteredKeysD,
    TimerMapping: timerMapping,
    ExcludeFromCTB: excludeFromCTB,
  };
}
