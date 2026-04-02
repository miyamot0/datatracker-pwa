import {
  walkSessionFrequencyKey,
  walkSessionDurationKeyStateAware,
  combineAndSortKeyPresses,
  sumDurationSpecialKeyStateAware,
  sumDurationScoringKeyStateAware,
} from '../schedule-parser';
import { SavedSessionResult } from '@/lib/dtos/session-results';
import { KeySetInstance } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';

describe('walkSessionFrequencyKey', () => {
  const mockKey: KeySetInstance = {
    KeyName: 'TestKey',
    KeyDescription: 'Test Frequency Key',
    KeyCode: 1,
  };

  const baseSessionSettings: SavedSessionResult = {
    Keyset: {
      id: 'test-keyset',
      Name: 'Test KeySet',
      FrequencyKeys: [mockKey],
      DurationKeys: [],
      createdAt: new Date('2023-01-01'),
      lastModified: new Date('2023-01-02'),
      DerivedKeys: [],
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
    },
    SpecialKeyTimers: {},
    SessionSettings: {} as any,
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    SessionStart: '2023-01-01T10:00:00Z',
    SessionEnd: '2023-01-01T10:10:00Z',
    EndedEarly: false,
    TimerMain: 600,
    TimerOne: 0,
    TimerTwo: 0,
    TimerThree: 0,
  };

  it('should handle odd number of schedule changes by processing from last change to session end', () => {
    const sessionWithOddSchedule: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer Start',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'System',
        },
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer End',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:15Z'),
          TimeIntoSession: 15.0,
          KeyType: 'System',
        },
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer Start (unpaired)',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:25Z'),
          TimeIntoSession: 25.0,
          KeyType: 'System',
        },
      ],
      FrequencyKeyPresses: [
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:08Z'),
          TimeIntoSession: 8.0,
          KeyType: 'Frequency',
        },
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:30Z'),
          TimeIntoSession: 30.0,
          KeyType: 'Frequency',
        },
      ],
    };

    const result = walkSessionFrequencyKey(sessionWithOddSchedule, 'Primary', mockKey);
    expect(result).toEqual({
      KeyName: 'TestKey',
      KeyDescription: 'Test Frequency Key',
      Schedule: 'Primary',
      Value: 2, // 1 from first period (8-15) + 1 from last unpaired period (30 before session end)
      Bouts: -1,
    });
  });

  it('should return zero count when no schedule changes exist', () => {
    const result = walkSessionFrequencyKey(baseSessionSettings, 'Primary', mockKey);

    expect(result).toEqual({
      KeyName: 'TestKey',
      KeyDescription: 'Test Frequency Key',
      Schedule: 'Primary',
      Value: 0,
      Bouts: -1,
    });
  });

  it('should count frequency key presses within single schedule period', () => {
    const sessionWithScheduleAndKeys: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer Start',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'System',
        },
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer End',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:15Z'),
          TimeIntoSession: 15.0,
          KeyType: 'System',
        },
      ],
      FrequencyKeyPresses: [
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:08Z'),
          TimeIntoSession: 8.0,
          KeyType: 'Frequency',
        },
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:12Z'),
          TimeIntoSession: 12.0,
          KeyType: 'Frequency',
        },
      ],
    };

    const result = walkSessionFrequencyKey(sessionWithScheduleAndKeys, 'Primary', mockKey);

    expect(result).toEqual({
      KeyName: 'TestKey',
      KeyDescription: 'Test Frequency Key',
      Schedule: 'Primary',
      Value: 2,
      Bouts: -1,
    });
  });

  it('should count frequency key presses within multiple schedule periods', () => {
    const sessionWithMultipleSchedules: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        // First schedule period
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer Start 1',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'System',
        },
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer End 1',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:15Z'),
          TimeIntoSession: 15.0,
          KeyType: 'System',
        },
        // Second schedule period
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer Start 2',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:25Z'),
          TimeIntoSession: 25.0,
          KeyType: 'System',
        },
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer End 2',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:35Z'),
          TimeIntoSession: 35.0,
          KeyType: 'System',
        },
      ],
      FrequencyKeyPresses: [
        // Keys in first period
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:08Z'),
          TimeIntoSession: 8.0,
          KeyType: 'Frequency',
        },
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:12Z'),
          TimeIntoSession: 12.0,
          KeyType: 'Frequency',
        },
        // Keys in second period
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:28Z'),
          TimeIntoSession: 28.0,
          KeyType: 'Frequency',
        },
        // Key outside periods (should not be counted)
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:20Z'),
          TimeIntoSession: 20.0,
          KeyType: 'Frequency',
        },
      ],
    };

    const result = walkSessionFrequencyKey(sessionWithMultipleSchedules, 'Primary', mockKey);

    expect(result).toEqual({
      KeyName: 'TestKey',
      KeyDescription: 'Test Frequency Key',
      Schedule: 'Primary',
      Value: 3, // 2 in first period + 1 in second period
      Bouts: -1,
    });
  });

  it('should ignore key presses outside schedule periods', () => {
    const sessionWithKeysOutsidePeriods: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer Start',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:10Z'),
          TimeIntoSession: 10.0,
          KeyType: 'System',
        },
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer End',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:20Z'),
          TimeIntoSession: 20.0,
          KeyType: 'System',
        },
      ],
      FrequencyKeyPresses: [
        // Before period
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'Frequency',
        },
        // After period
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:25Z'),
          TimeIntoSession: 25.0,
          KeyType: 'Frequency',
        },
      ],
    };

    const result = walkSessionFrequencyKey(sessionWithKeysOutsidePeriods, 'Primary', mockKey);

    expect(result).toEqual({
      KeyName: 'TestKey',
      KeyDescription: 'Test Frequency Key',
      Schedule: 'Primary',
      Value: 0,
      Bouts: -1,
    });
  });

  it('should only count keys matching the specified key name', () => {
    const sessionWithMultipleKeys: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer Start',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'System',
        },
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer End',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:15Z'),
          TimeIntoSession: 15.0,
          KeyType: 'System',
        },
      ],
      FrequencyKeyPresses: [
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:08Z'),
          TimeIntoSession: 8.0,
          KeyType: 'Frequency',
        },
        {
          KeyName: 'OtherKey',
          KeyCode: 2,
          KeyDescription: 'Other Frequency Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:12Z'),
          TimeIntoSession: 12.0,
          KeyType: 'Frequency',
        },
      ],
    };

    const result = walkSessionFrequencyKey(sessionWithMultipleKeys, 'Primary', mockKey);

    expect(result).toEqual({
      KeyName: 'TestKey',
      KeyDescription: 'Test Frequency Key',
      Schedule: 'Primary',
      Value: 1, // Only TestKey should be counted
      Bouts: -1,
    });
  });

  it('should work with different schedule types', () => {
    const sessionWithSecondarySchedule: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'Secondary',
          KeyCode: -1,
          KeyDescription: 'Secondary Timer Start',
          KeyScheduleRecording: 'Secondary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'System',
        },
        {
          KeyName: 'Secondary',
          KeyCode: -1,
          KeyDescription: 'Secondary Timer End',
          KeyScheduleRecording: 'Secondary',
          TimePressed: new Date('2023-01-01T10:00:15Z'),
          TimeIntoSession: 15.0,
          KeyType: 'System',
        },
      ],
      FrequencyKeyPresses: [
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Secondary',
          TimePressed: new Date('2023-01-01T10:00:08Z'),
          TimeIntoSession: 8.0,
          KeyType: 'Frequency',
        },
      ],
    };

    const result = walkSessionFrequencyKey(sessionWithSecondarySchedule, 'Secondary', mockKey);

    expect(result).toEqual({
      KeyName: 'TestKey',
      KeyDescription: 'Test Frequency Key',
      Schedule: 'Secondary',
      Value: 1,
      Bouts: -1,
    });
  });

  it('should handle Special schedule with SpecialKey parameter', () => {
    const sessionWithSpecialSchedule: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'CustomSpecialKey',
          KeyCode: -3,
          KeyDescription: 'Custom Special Key Start',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'System',
        },
        {
          KeyName: 'CustomSpecialKey',
          KeyCode: -3,
          KeyDescription: 'Custom Special Key End',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:15Z'),
          TimeIntoSession: 15.0,
          KeyType: 'System',
        },
      ],
      FrequencyKeyPresses: [
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:08Z'),
          TimeIntoSession: 8.0,
          KeyType: 'Frequency',
        },
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:12Z'),
          TimeIntoSession: 12.0,
          KeyType: 'Frequency',
        },
      ],
    };

    const result = walkSessionFrequencyKey(sessionWithSpecialSchedule, 'Special', mockKey, {
      special: true,
      schedule: 'system',
      specialKeyName: 'CustomSpecialKey',
      keyset: {
        id: 'test-keyset',
        Name: 'Test KeySet',
        FrequencyKeys: [mockKey],
        DurationKeys: [],
        createdAt: new Date('2023-01-01'),
        lastModified: new Date('2023-01-02'),
        SpecialDurationKeys: [],
        ScorableDurationKeys: [],
        DerivedKeys: [],
      },
      timerType: 'Total',
    });

    expect(result).toEqual({
      KeyName: 'TestKey',
      KeyDescription: 'Test Frequency Key',
      Schedule: 'Special',
      Value: 2,
      Bouts: -1,
    });
  });

  it('should handle odd special schedule without SpecialKey parameter by treating as regular schedule', () => {
    const sessionWithSpecialSchedule: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'Special',
          KeyCode: -3,
          KeyDescription: 'Special Timer Start',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'System',
        },
        {
          KeyName: 'Special',
          KeyCode: -3,
          KeyDescription: 'Special Timer End',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:15Z'),
          TimeIntoSession: 15.0,
          KeyType: 'System',
        },
        {
          KeyName: 'Special',
          KeyCode: -3,
          KeyDescription: 'Special Timer Start (unpaired)',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:25Z'),
          TimeIntoSession: 25.0,
          KeyType: 'System',
        },
      ],
      FrequencyKeyPresses: [
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:10Z'),
          TimeIntoSession: 10.0,
          KeyType: 'Frequency',
        },
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:30Z'),
          TimeIntoSession: 30.0,
          KeyType: 'Frequency',
        },
      ],
    };

    const result = walkSessionFrequencyKey(sessionWithSpecialSchedule, 'Special', mockKey);
    expect(result).toEqual({
      KeyName: 'TestKey',
      KeyDescription: 'Test Frequency Key',
      Schedule: 'Special',
      Value: 2,
      Bouts: -1,
    });
  });

  it('should handle empty key presses within valid schedule period', () => {
    const sessionWithNoKeyPresses: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer Start',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'System',
        },
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Timer End',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:15Z'),
          TimeIntoSession: 15.0,
          KeyType: 'System',
        },
      ],
      FrequencyKeyPresses: [], // No frequency key presses
    };

    const result = walkSessionFrequencyKey(sessionWithNoKeyPresses, 'Primary', mockKey);

    expect(result).toEqual({
      KeyName: 'TestKey',
      KeyDescription: 'Test Frequency Key',
      Schedule: 'Primary',
      Value: 0,
      Bouts: -1,
    });
  });

  it('should handle Special schedule with duration-based strategy', () => {
    const mockKeyset = {
      id: 'test-keyset',
      Name: 'Test KeySet',
      FrequencyKeys: [mockKey],
      DurationKeys: [],
      createdAt: new Date('2023-01-01'),
      lastModified: new Date('2023-01-02'),
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
      DerivedKeys: [],
    };
    const sessionWithDurationStrategy: SavedSessionResult = {
      ...baseSessionSettings,
      DurationKeyPresses: [
        {
          KeyName: 'ScheduleKey',
          KeyCode: 5,
          KeyDescription: 'Schedule Key Start',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'Duration',
        },
        {
          KeyName: 'ScheduleKey',
          KeyCode: 5,
          KeyDescription: 'Schedule Key End',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:15Z'),
          TimeIntoSession: 15.0,
          KeyType: 'Duration',
        },
      ],
      FrequencyKeyPresses: [
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:08Z'),
          TimeIntoSession: 8.0,
          KeyType: 'Frequency',
        },
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:12Z'),
          TimeIntoSession: 12.0,
          KeyType: 'Frequency',
        },
      ],
    };

    const result = walkSessionFrequencyKey(sessionWithDurationStrategy, 'Special', mockKey, {
      special: true,
      schedule: 'duration',
      specialKeyName: 'ScheduleKey',
      keyset: mockKeyset,
      timerType: 'Total',
    });

    expect(result).toEqual({
      KeyName: 'TestKey',
      KeyDescription: 'Test Frequency Key',
      Schedule: 'Special',
      Value: 2,
      Bouts: -1,
    });
  });

  it('should handle duration strategy with odd schedule changes', () => {
    const mockKeyset = {
      id: 'test-keyset',
      Name: 'Test KeySet',
      FrequencyKeys: [mockKey],
      DurationKeys: [],
      createdAt: new Date('2023-01-01'),
      lastModified: new Date('2023-01-02'),
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
      DerivedKeys: [],
    };
    const sessionWithOddDuration: SavedSessionResult = {
      ...baseSessionSettings,
      DurationKeyPresses: [
        {
          KeyName: 'ScheduleKey',
          KeyCode: 5,
          KeyDescription: 'Schedule Key Start',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'Duration',
        },
        {
          KeyName: 'ScheduleKey',
          KeyCode: 5,
          KeyDescription: 'Schedule Key End',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:15Z'),
          TimeIntoSession: 15.0,
          KeyType: 'Duration',
        },
        {
          KeyName: 'ScheduleKey',
          KeyCode: 5,
          KeyDescription: 'Schedule Key Start (unpaired)',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:25Z'),
          TimeIntoSession: 25.0,
          KeyType: 'Duration',
        },
      ],
      FrequencyKeyPresses: [
        {
          KeyName: 'TestKey',
          KeyCode: 1,
          KeyDescription: 'Test Frequency Key',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:10Z'),
          TimeIntoSession: 10.0,
          KeyType: 'Frequency',
        },
      ],
    };

    const result = walkSessionFrequencyKey(sessionWithOddDuration, 'Special', mockKey, {
      special: true,
      schedule: 'duration',
      specialKeyName: 'ScheduleKey',
      keyset: mockKeyset,
      timerType: 'Total',
    });
    expect(result).toEqual({
      KeyName: 'TestKey',
      KeyDescription: 'Test Frequency Key',
      Schedule: 'Special',
      Value: 1,
      Bouts: -1,
    });
  });
});

describe('walkSessionDurationKeyStateAware', () => {
  const mockKey: KeySetInstance = {
    KeyName: 'DurationKey',
    KeyDescription: 'Test Duration Key',
    KeyCode: 1,
  };

  const baseSessionSettings: SavedSessionResult = {
    Keyset: {
      id: 'test-keyset',
      Name: 'Test KeySet',
      FrequencyKeys: [],
      DurationKeys: [mockKey],
      DerivedKeys: [],
      createdAt: new Date('2023-01-01'),
      lastModified: new Date('2023-01-02'),
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
    },
    SessionSettings: {} as any,
    SpecialKeyTimers: {},
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    SessionStart: '2023-01-01T10:00:00Z',
    SessionEnd: '2023-01-01T10:10:00Z',
    EndedEarly: false,
    TimerMain: 600,
    TimerOne: 0,
    TimerTwo: 0,
    TimerThree: 0,
  };

  it('counts from schedule start when key is already active', () => {
    const session: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Start',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:10Z'),
          TimeIntoSession: 10,
          KeyType: 'System',
        },
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary End',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:20Z'),
          TimeIntoSession: 20,
          KeyType: 'System',
        },
      ],
      DurationKeyPresses: [
        {
          KeyName: 'DurationKey',
          KeyCode: 1,
          KeyDescription: 'DurationKey Toggle On',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5,
          KeyType: 'Duration',
        },
        {
          KeyName: 'DurationKey',
          KeyCode: 1,
          KeyDescription: 'DurationKey Toggle Off',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:12Z'),
          TimeIntoSession: 12,
          KeyType: 'Duration',
        },
      ],
    };

    const result = walkSessionDurationKeyStateAware(session, 'Primary', mockKey);

    expect(result.Value).toBe(2);
  });

  it('handles release then re-press within window when active at start', () => {
    const session: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Start',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:10Z'),
          TimeIntoSession: 10,
          KeyType: 'System',
        },
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary End',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:20Z'),
          TimeIntoSession: 20,
          KeyType: 'System',
        },
      ],
      DurationKeyPresses: [
        {
          KeyName: 'DurationKey',
          KeyCode: 1,
          KeyDescription: 'Toggle On',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5,
          KeyType: 'Duration',
        },
        {
          KeyName: 'DurationKey',
          KeyCode: 1,
          KeyDescription: 'Toggle Off',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:12Z'),
          TimeIntoSession: 12,
          KeyType: 'Duration',
        },
        {
          KeyName: 'DurationKey',
          KeyCode: 1,
          KeyDescription: 'Toggle On',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:16Z'),
          TimeIntoSession: 16,
          KeyType: 'Duration',
        },
        {
          KeyName: 'DurationKey',
          KeyCode: 1,
          KeyDescription: 'Toggle Off',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:24Z'),
          TimeIntoSession: 24,
          KeyType: 'Duration',
        },
      ],
    };

    const result = walkSessionDurationKeyStateAware(session, 'Primary', mockKey);

    expect(result.Value).toBe(6);
  });

  it('treats event at interval start as state-defining for the interval', () => {
    const session: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Start',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:10Z'),
          TimeIntoSession: 10,
          KeyType: 'System',
        },
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary End',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:20Z'),
          TimeIntoSession: 20,
          KeyType: 'System',
        },
      ],
      DurationKeyPresses: [
        {
          KeyName: 'DurationKey',
          KeyCode: 1,
          KeyDescription: 'Toggle On At Start',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:10Z'),
          TimeIntoSession: 10,
          KeyType: 'Duration',
        },
        {
          KeyName: 'DurationKey',
          KeyCode: 1,
          KeyDescription: 'Toggle Off At End',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:20Z'),
          TimeIntoSession: 20,
          KeyType: 'Duration',
        },
      ],
    };

    const result = walkSessionDurationKeyStateAware(session, 'Primary', mockKey);

    expect(result.Value).toBe(10);
  });

  it('closes odd schedule windows at session end', () => {
    const session: SavedSessionResult = {
      ...baseSessionSettings,
      SessionEnd: '2023-01-01T10:00:30Z',
      SystemKeyPresses: [
        {
          KeyName: 'Primary',
          KeyCode: -1,
          KeyDescription: 'Primary Start Only',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:10Z'),
          TimeIntoSession: 10,
          KeyType: 'System',
        },
      ],
      DurationKeyPresses: [
        {
          KeyName: 'DurationKey',
          KeyCode: 1,
          KeyDescription: 'Toggle On',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:12Z'),
          TimeIntoSession: 12,
          KeyType: 'Duration',
        },
        {
          KeyName: 'DurationKey',
          KeyCode: 1,
          KeyDescription: 'Toggle Off',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:18Z'),
          TimeIntoSession: 18,
          KeyType: 'Duration',
        },
      ],
    };

    const result = walkSessionDurationKeyStateAware(session, 'Primary', mockKey);

    expect(result.Value).toBe(6);
  });
});

describe('combineAndSortKeyPresses', () => {
  const mockSession: ModifiedSessionResult = {
    Filename: 'test-session.json',
    Keyset: {
      id: 'test-keyset',
      Name: 'Test KeySet',
      FrequencyKeys: [],
      DurationKeys: [],
      createdAt: new Date('2023-01-01'),
      lastModified: new Date('2023-01-02'),
      DerivedKeys: [],
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
    },
    SessionSettings: {} as any,
    SpecialKeyTimers: {},
    SystemKeyPresses: [
      {
        KeyName: 'System1',
        KeyCode: -1,
        KeyDescription: 'System Key 1',
        KeyScheduleRecording: 'Primary',
        TimePressed: new Date('2023-01-01T10:00:05Z'),
        TimeIntoSession: 5.0,
        KeyType: 'System',
      },
      {
        KeyName: 'System2',
        KeyCode: -2,
        KeyDescription: 'System Key 2',
        KeyScheduleRecording: 'Primary',
        TimePressed: new Date('2023-01-01T10:00:25Z'),
        TimeIntoSession: 25.0,
        KeyType: 'System',
      },
    ],
    FrequencyKeyPresses: [
      {
        KeyName: 'Freq1',
        KeyCode: 1,
        KeyDescription: 'Frequency Key 1',
        KeyScheduleRecording: 'Primary',
        TimePressed: new Date('2023-01-01T10:00:10Z'),
        TimeIntoSession: 10.0,
        KeyType: 'Frequency',
      },
      {
        KeyName: 'Freq2',
        KeyCode: 2,
        KeyDescription: 'Frequency Key 2',
        KeyScheduleRecording: 'Primary',
        TimePressed: new Date('2023-01-01T10:00:30Z'),
        TimeIntoSession: 30.0,
        KeyType: 'Frequency',
      },
    ],
    DurationKeyPresses: [
      {
        KeyName: 'Dur1',
        KeyCode: 3,
        KeyDescription: 'Duration Key 1',
        KeyScheduleRecording: 'Primary',
        TimePressed: new Date('2023-01-01T10:00:15Z'),
        TimeIntoSession: 15.0,
        KeyType: 'Duration',
      },
      {
        KeyName: 'Dur2',
        KeyCode: 4,
        KeyDescription: 'Duration Key 2',
        KeyScheduleRecording: 'Primary',
        TimePressed: new Date('2023-01-01T10:00:20Z'),
        TimeIntoSession: 20.0,
        KeyType: 'Duration',
      },
    ],
    SessionStart: '2023-01-01T10:00:00Z',
    SessionEnd: '2023-01-01T10:00:35Z',
    EndedEarly: false,
    TimerMain: 35,
    TimerOne: 0,
    TimerTwo: 0,
    TimerThree: 0,
  };

  it('should combine all key press arrays and sort by TimeIntoSession', () => {
    const result = combineAndSortKeyPresses(mockSession);

    expect(result).toHaveLength(6);
    expect(result.map((k) => ({ name: k.KeyName, time: k.TimeIntoSession }))).toEqual([
      { name: 'System1', time: 5.0 },
      { name: 'Freq1', time: 10.0 },
      { name: 'Dur1', time: 15.0 },
      { name: 'Dur2', time: 20.0 },
      { name: 'System2', time: 25.0 },
      { name: 'Freq2', time: 30.0 },
    ]);
  });

  it('should handle empty arrays correctly', () => {
    const emptySession: ModifiedSessionResult = {
      ...mockSession,
      SystemKeyPresses: [],
      FrequencyKeyPresses: [],
      DurationKeyPresses: [],
    };

    const result = combineAndSortKeyPresses(emptySession);

    expect(result).toEqual([]);
  });

  it('should handle sessions with only one type of key press', () => {
    const frequencyOnlySession: ModifiedSessionResult = {
      ...mockSession,
      SystemKeyPresses: [],
      DurationKeyPresses: [],
    };

    const result = combineAndSortKeyPresses(frequencyOnlySession);

    expect(result).toHaveLength(2);
    expect(result.map((k) => ({ name: k.KeyName, time: k.TimeIntoSession }))).toEqual([
      { name: 'Freq1', time: 10.0 },
      { name: 'Freq2', time: 30.0 },
    ]);
  });

  it('should handle keys with identical TimeIntoSession values', () => {
    const sessionWithIdenticalTimes: ModifiedSessionResult = {
      ...mockSession,
      FrequencyKeyPresses: [
        {
          KeyName: 'Freq1',
          KeyCode: 1,
          KeyDescription: 'Frequency Key 1',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:10Z'),
          TimeIntoSession: 15.0,
          KeyType: 'Frequency',
        },
      ],
      DurationKeyPresses: [
        {
          KeyName: 'Dur1',
          KeyCode: 3,
          KeyDescription: 'Duration Key 1',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:15Z'),
          TimeIntoSession: 15.0,
          KeyType: 'Duration',
        },
      ],
    };

    const result = combineAndSortKeyPresses(sessionWithIdenticalTimes);

    // Should include both keys and maintain stable sort
    expect(result).toHaveLength(4);
    expect(result.filter((k) => k.TimeIntoSession === 15.0)).toHaveLength(2);
  });

  it('should preserve all key properties during combination and sorting', () => {
    const result = combineAndSortKeyPresses(mockSession);

    // Check that all properties are preserved
    const firstKey = result[0];
    expect(firstKey).toEqual({
      KeyName: 'System1',
      KeyCode: -1,
      KeyDescription: 'System Key 1',
      KeyScheduleRecording: 'Primary',
      TimePressed: new Date('2023-01-01T10:00:05Z'),
      TimeIntoSession: 5.0,
      KeyType: 'System',
    });
  });
});

describe('sumDurationSpecialKeyStateAware', () => {
  const baseSessionSettings: SavedSessionResult = {
    Keyset: {
      id: 'test-keyset',
      Name: 'Test KeySet',
      FrequencyKeys: [],
      DurationKeys: [],
      createdAt: new Date('2023-01-01'),
      lastModified: new Date('2023-01-02'),
      DerivedKeys: [],
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
    },
    SessionSettings: {} as any,
    SpecialKeyTimers: {},
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    SessionStart: '2023-01-01T10:00:00Z',
    SessionEnd: '2023-01-01T10:10:00Z',
    EndedEarly: false,
    TimerMain: 600,
    TimerOne: 0,
    TimerTwo: 0,
    TimerThree: 0,
  };

  it('matches legacy behavior for standard start-end pairs', () => {
    const session: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'SpecialTimer',
          KeyCode: -3,
          KeyDescription: 'Start',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5,
          KeyType: 'System',
        },
        {
          KeyName: 'SpecialTimer',
          KeyCode: -3,
          KeyDescription: 'End',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:15Z'),
          TimeIntoSession: 15,
          KeyType: 'System',
        },
      ],
    };

    expect(sumDurationSpecialKeyStateAware(session, 'SpecialTimer')).toBe(10);
  });

  it('supports release-first sessions when key starts active', () => {
    const session: SavedSessionResult = {
      ...baseSessionSettings,
      SystemKeyPresses: [
        {
          KeyName: 'SpecialTimer',
          KeyCode: -3,
          KeyDescription: 'Release',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5,
          KeyType: 'System',
        },
        {
          KeyName: 'SpecialTimer',
          KeyCode: -3,
          KeyDescription: 'Press',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:20Z'),
          TimeIntoSession: 20,
          KeyType: 'System',
        },
        {
          KeyName: 'SpecialTimer',
          KeyCode: -3,
          KeyDescription: 'Release',
          KeyScheduleRecording: 'Special',
          TimePressed: new Date('2023-01-01T10:00:30Z'),
          TimeIntoSession: 30,
          KeyType: 'System',
        },
      ],
    };

    expect(sumDurationSpecialKeyStateAware(session, 'SpecialTimer', { startsActive: true })).toBe(15);
  });
});

describe('sumDurationScoringKeyStateAware', () => {
  const baseSessionSettings: SavedSessionResult = {
    Keyset: {
      id: 'test-keyset',
      Name: 'Test KeySet',
      FrequencyKeys: [],
      DurationKeys: [],
      createdAt: new Date('2023-01-01'),
      lastModified: new Date('2023-01-02'),
      DerivedKeys: [],
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
    },
    SessionSettings: {} as any,
    SpecialKeyTimers: {},
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    SessionStart: '2023-01-01T10:00:00Z',
    SessionEnd: '2023-01-01T10:10:00Z',
    EndedEarly: false,
    TimerMain: 600,
    TimerOne: 0,
    TimerTwo: 0,
    TimerThree: 0,
  };

  it('matches legacy behavior for standard start-end pairs', () => {
    const session: SavedSessionResult = {
      ...baseSessionSettings,
      DurationKeyPresses: [
        {
          KeyName: 'ScoringKey',
          KeyCode: 10,
          KeyDescription: 'Start',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5,
          KeyType: 'Duration',
        },
        {
          KeyName: 'ScoringKey',
          KeyCode: 10,
          KeyDescription: 'End',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:12Z'),
          TimeIntoSession: 12,
          KeyType: 'Duration',
        },
      ],
    };

    expect(sumDurationScoringKeyStateAware(session, 'ScoringKey')).toBe(7);
  });

  it('supports release-first sessions when key starts active', () => {
    const session: SavedSessionResult = {
      ...baseSessionSettings,
      DurationKeyPresses: [
        {
          KeyName: 'ScoringKey',
          KeyCode: 10,
          KeyDescription: 'Release',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5,
          KeyType: 'Duration',
        },
        {
          KeyName: 'ScoringKey',
          KeyCode: 10,
          KeyDescription: 'Press',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:20Z'),
          TimeIntoSession: 20,
          KeyType: 'Duration',
        },
        {
          KeyName: 'ScoringKey',
          KeyCode: 10,
          KeyDescription: 'Release',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:30Z'),
          TimeIntoSession: 30,
          KeyType: 'Duration',
        },
      ],
    };

    expect(sumDurationScoringKeyStateAware(session, 'ScoringKey', { startsActive: true })).toBe(15);
  });
});
