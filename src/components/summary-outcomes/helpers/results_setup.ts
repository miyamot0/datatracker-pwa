import { getLocalCachedPrefs } from '@/lib/local_storage';
import { EnhancedKeySetInstance } from '@/types/keyset';
import { ScheduleMappingOptions } from '@/types/schedules';
import { KeySet } from '@/types/keyset';

export function PullRelevantSetup(Group: string, Individual: string, Evaluation: string, KeySet: KeySet) {
  const stored_prefs_F = getLocalCachedPrefs(Group, Individual, Evaluation, 'Rate');

  const enhancedKeySetF: EnhancedKeySetInstance[] = KeySet.FrequencyKeys.map((key) => ({
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

  const excludeFromCTB = baseUnfilteredKeysF.map((key) => {
    const should_disable = stored_prefs_F.CTBElements.includes(key.KeyDescription);

    if (should_disable) {
      return {
        ...key,
        Visible: false,
      };
    }

    return key;
  });

  const stored_prefs_D = getLocalCachedPrefs(Group, Individual, Evaluation, 'Duration');

  const enhancedKeySetD: EnhancedKeySetInstance[] = KeySet.DurationKeys.map((key) => ({
    ...key,
    Visible: true,
    Type: 'Key',
  }));

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

  const timerMapping =
    ScheduleMappingOptions.find((i) => i.value === stored_prefs_F?.Schedule) ?? ScheduleMappingOptions[0];

  return {
    UnfilteredKeysFrequency: baseUnfilteredKeysF,
    UnfilteredKeysDuration: baseUnfilteredKeysD,
    TimerMapping: timerMapping,
    ExcludeFromCTB: excludeFromCTB,
  };
}
