import { describe, it, expect } from 'vitest';
import { PROCESSING_TEMPLATES, processMultipleSessionDataWithKeys } from '../calculations';
import type { SavedSessionResult } from '../dtos';
import type { KeySet } from '@/types/keyset/core';
import type { LogicState } from '../logic';

// --- Shared Fixtures ---

const freqKey = { KeyCode: 1, KeyName: 'Aggression', KeyDescription: 'Physical Aggression' };
const durKey = { KeyCode: 2, KeyName: 'SIB', KeyDescription: 'Self-Injurious Behavior' };

const derivedKey: LogicState = {
  id: 'derived-1',
  name: 'Aggression Sum',
  initial: {
    type: 'field',
    field: { KeyCode: 1, KeyName: 'Aggression', KeyDescription: 'Physical Aggression', Value: 0, Tag: '' },
  },
  fields: [{ KeyCode: 1, KeyName: 'Aggression', KeyDescription: 'Physical Aggression', Value: 0, Tag: '' }],
  steps: [],
  value: 0,
};

const fullKeyset: KeySet = {
  id: 'ks1',
  Name: 'Test Keyset',
  FrequencyKeys: [freqKey],
  DurationKeys: [durKey],
  DerivedKeys: [derivedKey],
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
  createdAt: new Date('2026-01-01'),
  lastModified: new Date('2026-01-01'),
};

const emptyKeyset: KeySet = {
  ...fullKeyset,
  FrequencyKeys: [],
  DurationKeys: [],
  DerivedKeys: [],
};

const baseSession: SavedSessionResult = {
  Keyset: fullKeyset,
  SessionSettings: {
    Session: 1,
    Condition: 'Baseline',
    Initials: 'JD',
    Therapist: 'Dr. Smith',
    TimerOption: 'End on Timer #1',
    Role: 'Primary',
    DurationS: 600,
    KeySet: 'TestKeySet',
  },
  SystemKeyPresses: [],
  FrequencyKeyPresses: [],
  DurationKeyPresses: [],
  SessionStart: '2026-03-26T10:00:00.000Z',
  SessionEnd: '2026-03-26T10:10:00.000Z',
  EndedEarly: false,
  TimerMain: 600, // 10 minutes in seconds
  TimerOne: 300, // 5 minutes
  TimerTwo: 200,
  TimerThree: 100,
  SpecialKeyTimers: {},
};

const mockStrategy = {
  special: false,
  schedule: 'system' as const,
  keyset: fullKeyset,
  timerType: 'Total' as const,
};

// --- PROCESSING_TEMPLATES ---

describe('PROCESSING_TEMPLATES', () => {
  describe('FREQUENCY_RATES', () => {
    it('returns correct timer options', () => {
      const opts = PROCESSING_TEMPLATES.FREQUENCY_RATES('Total', mockStrategy);
      expect(opts.timer.timerType).toBe('Total');
      expect(opts.timer.includeRates).toBe(true);
      expect(opts.timer.includePercentages).toBeUndefined();
      expect(opts.timer.includeBouts).toBeUndefined();
    });

    it('returns correct key type options', () => {
      const opts = PROCESSING_TEMPLATES.FREQUENCY_RATES('Total', mockStrategy);
      expect(opts.keyTypes.frequency).toBe(true);
      expect(opts.keyTypes.duration).toBe(false);
      expect(opts.keyTypes.derived).toBe(true);
      expect(opts.outputFormat).toBe('chart');
    });

    it('passes through strategy and timerType', () => {
      const opts = PROCESSING_TEMPLATES.FREQUENCY_RATES('Timer1', mockStrategy);
      expect(opts.strategy).toBe(mockStrategy);
      expect(opts.timer.timerType).toBe('Timer1');
    });
  });

  describe('DURATION_PERCENTAGES', () => {
    it('returns correct timer options', () => {
      const opts = PROCESSING_TEMPLATES.DURATION_PERCENTAGES('Total', mockStrategy);
      expect(opts.timer.timerType).toBe('Total');
      expect(opts.timer.includePercentages).toBe(true);
      expect(opts.timer.includeBouts).toBe(true);
      expect(opts.timer.includeRates).toBeUndefined();
    });

    it('returns correct key type options', () => {
      const opts = PROCESSING_TEMPLATES.DURATION_PERCENTAGES('Total', mockStrategy);
      expect(opts.keyTypes.frequency).toBe(false);
      expect(opts.keyTypes.duration).toBe(true);
      expect(opts.keyTypes.derived).toBe(false);
      expect(opts.outputFormat).toBe('chart');
    });

    it('passes through strategy and timerType', () => {
      const opts = PROCESSING_TEMPLATES.DURATION_PERCENTAGES('Timer2', mockStrategy);
      expect(opts.strategy).toBe(mockStrategy);
      expect(opts.timer.timerType).toBe('Timer2');
    });
  });

  describe('SPREADSHEET_ALL', () => {
    it('returns correct timer options', () => {
      const opts = PROCESSING_TEMPLATES.SPREADSHEET_ALL('Total', mockStrategy);
      expect(opts.timer.includeRates).toBe(true);
      expect(opts.timer.includePercentages).toBe(true);
      expect(opts.timer.includeBouts).toBe(true);
    });

    it('returns correct key type options', () => {
      const opts = PROCESSING_TEMPLATES.SPREADSHEET_ALL('Total', mockStrategy);
      expect(opts.keyTypes.frequency).toBe(true);
      expect(opts.keyTypes.duration).toBe(true);
      expect(opts.keyTypes.derived).toBe(true);
      expect(opts.outputFormat).toBe('spreadsheet');
    });

    it('passes through strategy and timerType', () => {
      const opts = PROCESSING_TEMPLATES.SPREADSHEET_ALL('Timer3', mockStrategy);
      expect(opts.strategy).toBe(mockStrategy);
      expect(opts.timer.timerType).toBe('Timer3');
    });
  });

  describe('CHART_ALL', () => {
    it('returns correct timer options', () => {
      const opts = PROCESSING_TEMPLATES.CHART_ALL('Total', mockStrategy);
      expect(opts.timer.includeRates).toBe(true);
      expect(opts.timer.includePercentages).toBe(true);
      expect(opts.timer.includeBouts).toBe(true);
    });

    it('returns correct key type options', () => {
      const opts = PROCESSING_TEMPLATES.CHART_ALL('Total', mockStrategy);
      expect(opts.keyTypes.frequency).toBe(true);
      expect(opts.keyTypes.duration).toBe(true);
      expect(opts.keyTypes.derived).toBe(true);
      expect(opts.outputFormat).toBe('chart');
    });

    it('passes through strategy and timerType', () => {
      const opts = PROCESSING_TEMPLATES.CHART_ALL('Timer1', mockStrategy);
      expect(opts.strategy).toBe(mockStrategy);
      expect(opts.timer.timerType).toBe('Timer1');
    });
  });
});

// --- processMultipleSessionDataWithKeys ---

describe('processMultipleSessionDataWithKeys', () => {
  it('returns empty array when given no sessions', () => {
    const results = processMultipleSessionDataWithKeys([], fullKeyset, 'Total');
    expect(results).toHaveLength(0);
  });

  it('processes multiple sessions and preserves order', () => {
    const session2 = { ...baseSession, SessionSettings: { ...baseSession.SessionSettings, Session: 2 } };
    const results = processMultipleSessionDataWithKeys([baseSession, session2], fullKeyset, 'Total');
    expect(results).toHaveLength(2);
    expect(results[0].session).toBe(1);
    expect(results[1].session).toBe(2);
  });

  it('maps session metadata correctly', () => {
    const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total');
    expect(result.session).toBe(1);
    expect(result.condition).toBe('Baseline');
    expect(result.collector).toBe('JD');
    expect(result.therapist).toBe('Dr. Smith');
    expect(result.timerType).toBe('Total');
    expect(result.timerLabel).toBe('Session');
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.toISOString()).toBe('2026-03-26T10:00:00.000Z');
  });

  it('computes timerDuration in minutes from TimerMain for Total', () => {
    const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total');
    expect(result.timerDuration).toBe(600 / 60);
  });

  it('defaults to SPREADSHEET_ALL template when none is supplied', () => {
    const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total');
    // SPREADSHEET_ALL enables all key types — all three arrays should be populated
    expect(result.frequencyKeys).toHaveLength(1);
    expect(result.durationKeys).toHaveLength(1);
    expect(result.derivedKeys).toHaveLength(1);
  });

  it('uses an explicitly supplied template', () => {
    const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'CHART_ALL');
    expect(result.frequencyKeys).toHaveLength(1);
    expect(result.durationKeys).toHaveLength(1);
    expect(result.derivedKeys).toHaveLength(1);
  });

  describe('frequency key processing', () => {
    it('processes frequency keys when keyTypes.frequency is true and keys exist', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'SPREADSHEET_ALL');
      expect(result.frequencyKeys).toHaveLength(1);
      expect(result.frequencyKeys[0].keyCode).toBe(freqKey.KeyCode);
      expect(result.frequencyKeys[0].keyType).toBe('Frequency');
      expect(result.frequencyKeys[0].rawValue).toBe(0);
    });

    it('skips frequency processing when keyTypes.frequency is false', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'DURATION_PERCENTAGES');
      expect(result.frequencyKeys).toHaveLength(0);
    });

    it('skips frequency processing when keyset has no frequency keys', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], emptyKeyset, 'Total', 'SPREADSHEET_ALL');
      expect(result.frequencyKeys).toHaveLength(0);
    });
  });

  describe('duration key processing', () => {
    it('processes duration keys when keyTypes.duration is true and keys exist', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'SPREADSHEET_ALL');
      expect(result.durationKeys).toHaveLength(1);
      expect(result.durationKeys[0].keyCode).toBe(durKey.KeyCode);
      expect(result.durationKeys[0].keyType).toBe('Duration');
      expect(result.durationKeys[0].rawValue).toBe(0);
    });

    it('skips duration processing when keyTypes.duration is false', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'FREQUENCY_RATES');
      expect(result.durationKeys).toHaveLength(0);
    });

    it('skips duration processing when keyset has no duration keys', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], emptyKeyset, 'Total', 'SPREADSHEET_ALL');
      expect(result.durationKeys).toHaveLength(0);
    });
  });

  describe('derived key processing', () => {
    it('processes derived keys when keyTypes.derived is true', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'SPREADSHEET_ALL');
      expect(result.derivedKeys).toHaveLength(1);
      expect(result.derivedKeys[0].keyName).toBe(derivedKey.name);
      expect(result.derivedKeys[0].keyType).toBe('Derived');
    });

    it('skips derived processing when keyTypes.derived is false', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'DURATION_PERCENTAGES');
      expect(result.derivedKeys).toHaveLength(0);
    });
  });

  describe('timer label and duration', () => {
    it('uses Timer1 label and TimerOne value', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Timer1');
      expect(result.timerLabel).toBe('Timer #1');
      expect(result.timerDuration).toBe(300 / 60);
    });

    it('uses Timer2 label and TimerTwo value', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Timer2');
      expect(result.timerLabel).toBe('Timer #2');
      expect(result.timerDuration).toBe(200 / 60);
    });

    it('uses Timer3 label and TimerThree value', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Timer3');
      expect(result.timerLabel).toBe('Timer #3');
      expect(result.timerDuration).toBe(100 / 60);
    });
  });

  describe('hidden key filtering', () => {
    it('filters out hidden frequency keys by KeyCode', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'SPREADSHEET_ALL', {
        frequencyKeys: [freqKey],
        durationKeys: [],
        derivedKeys: [],
      });
      expect(result.frequencyKeys).toHaveLength(0);
    });

    it('keeps frequency keys not in the hidden list', () => {
      const otherKey = { KeyCode: 99, KeyName: 'Other', KeyDescription: 'Other Key' };
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'SPREADSHEET_ALL', {
        frequencyKeys: [otherKey],
        durationKeys: [],
        derivedKeys: [],
      });
      expect(result.frequencyKeys).toHaveLength(1);
    });

    it('filters out hidden duration keys by KeyCode', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'SPREADSHEET_ALL', {
        frequencyKeys: [],
        durationKeys: [durKey],
        derivedKeys: [],
      });
      expect(result.durationKeys).toHaveLength(0);
    });

    it('keeps duration keys not in the hidden list', () => {
      const otherKey = { KeyCode: 99, KeyName: 'Other', KeyDescription: 'Other Key' };
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'SPREADSHEET_ALL', {
        frequencyKeys: [],
        durationKeys: [otherKey],
        derivedKeys: [],
      });
      expect(result.durationKeys).toHaveLength(1);
    });

    it('filters out hidden derived keys by name', () => {
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'SPREADSHEET_ALL', {
        frequencyKeys: [],
        durationKeys: [],
        derivedKeys: [derivedKey],
      });
      expect(result.derivedKeys).toHaveLength(0);
    });

    it('keeps derived keys not in the hidden list', () => {
      const otherDerived = { ...derivedKey, name: 'Different Derived' };
      const [result] = processMultipleSessionDataWithKeys([baseSession], fullKeyset, 'Total', 'SPREADSHEET_ALL', {
        frequencyKeys: [],
        durationKeys: [],
        derivedKeys: [otherDerived],
      });
      expect(result.derivedKeys).toHaveLength(1);
    });
  });
});
