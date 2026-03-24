import { preparePlotDataCumulative } from '../summary';
import { ModifiedSessionResult } from '@/types/storage';

// Mock dependencies
vi.mock('../local_storage', () => ({
  getLocalCachedPrefs: vi.fn(),
}));

vi.mock('../schedule-parser', () => ({
  walkSessionFrequencyKey: vi.fn(),
  walkSessionDurationKey: vi.fn(),
}));

vi.mock('../logic', () => ({
  evaluateLogic: vi.fn(),
}));

describe('preparePlotDataCumulative', () => {
  const baseMockSession: ModifiedSessionResult = {
    Filename: 'test-session.json',
    Keyset: {
      id: 'test-keyset',
      Name: 'Test KeySet',
      FrequencyKeys: [
        { KeyName: 'F1', KeyDescription: 'Key A', KeyCode: 1 },
        { KeyName: 'F2', KeyDescription: 'Key B', KeyCode: 2 },
      ],
      SpecialDurationKeys: [],
      DurationKeys: [],
      createdAt: new Date('2023-01-01'),
      lastModified: new Date('2023-01-02'),
      DerivedKeys: [],
    },
    SessionSettings: {} as any,
    SpecialKeyTimers: {},
    SystemKeyPresses: [],
    FrequencyKeyPresses: [
      {
        KeyName: 'F1',
        KeyCode: 1,
        KeyDescription: 'Key A',
        KeyScheduleRecording: 'Primary',
        TimePressed: new Date('2023-01-01T10:00:05Z'),
        TimeIntoSession: 5.0,
        KeyType: 'Frequency',
      },
      {
        KeyName: 'F2',
        KeyCode: 2,
        KeyDescription: 'Key B',
        KeyScheduleRecording: 'Primary',
        TimePressed: new Date('2023-01-01T10:00:10Z'),
        TimeIntoSession: 10.0,
        KeyType: 'Frequency',
      },
      {
        KeyName: 'F1',
        KeyCode: 1,
        KeyDescription: 'Key A',
        KeyScheduleRecording: 'Primary',
        TimePressed: new Date('2023-01-01T10:00:15Z'),
        TimeIntoSession: 15.0,
        KeyType: 'Frequency',
      },
    ],
    DurationKeyPresses: [],
    SessionStart: '2023-01-01T10:00:00Z',
    SessionEnd: '2023-01-01T10:00:30Z',
    EndedEarly: false,
    TimerMain: 30.0,
    TimerOne: 0,
    TimerTwo: 0,
    TimerThree: 0,
  };

  it('should create initial point at time 0 with all keys set to 0', () => {
    const result = preparePlotDataCumulative(baseMockSession);

    expect(result[0]).toEqual({
      second: 0,
      'Key A': 0,
      'Key B': 0,
    });
  });

  it('should create cumulative plot data for key presses', () => {
    const result = preparePlotDataCumulative(baseMockSession);

    // Should have: initial + 2*(3 key presses) + final = 8 points
    expect(result).toHaveLength(8);

    // Check sequence of points
    expect(result[0]).toEqual({ second: 0, 'Key A': 0, 'Key B': 0 });
    expect(result[1]).toEqual({ second: 5, 'Key A': 0, 'Key B': 0 }); // Before increment
    expect(result[2]).toEqual({ second: 5, 'Key A': 1, 'Key B': 0 }); // After increment
    expect(result[3]).toEqual({ second: 10, 'Key A': 1, 'Key B': 0 }); // Before increment
    expect(result[4]).toEqual({ second: 10, 'Key A': 1, 'Key B': 1 }); // After increment
    expect(result[5]).toEqual({ second: 15, 'Key A': 1, 'Key B': 1 }); // Before increment
    expect(result[6]).toEqual({ second: 15, 'Key A': 2, 'Key B': 1 }); // After increment
    expect(result[7]).toEqual({ second: 30, 'Key A': 2, 'Key B': 1 }); // Final point
  });

  it('should add final point at session end with cumulative totals', () => {
    const result = preparePlotDataCumulative(baseMockSession);

    const finalPoint = result[result.length - 1];
    expect(finalPoint).toEqual({
      second: 30,
      'Key A': 2,
      'Key B': 1,
    });
  });

  it('should handle session with no key presses', () => {
    const emptySession: ModifiedSessionResult = {
      ...baseMockSession,
      FrequencyKeyPresses: [],
    };

    const result = preparePlotDataCumulative(emptySession);

    // Should have initial + final = 2 points
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ second: 0, 'Key A': 0, 'Key B': 0 });
    expect(result[1]).toEqual({ second: 30, 'Key A': 0, 'Key B': 0 });
  });

  it('should handle session with single key', () => {
    const singleKeySession: ModifiedSessionResult = {
      ...baseMockSession,
      Keyset: {
        ...baseMockSession.Keyset,
        FrequencyKeys: [{ KeyName: 'F1', KeyDescription: 'Single Key', KeyCode: 1 }],
      },
      FrequencyKeyPresses: [
        {
          KeyName: 'F1',
          KeyCode: 1,
          KeyDescription: 'Single Key',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'Frequency',
        },
      ],
    };

    const result = preparePlotDataCumulative(singleKeySession);

    expect(result).toHaveLength(4); // initial + before/after + final
    expect(result[0]).toEqual({ second: 0, 'Single Key': 0 });
    expect(result[1]).toEqual({ second: 5, 'Single Key': 0 });
    expect(result[2]).toEqual({ second: 5, 'Single Key': 1 });
    expect(result[3]).toEqual({ second: 30, 'Single Key': 1 });
  });

  it('should handle fractional time values by flooring them', () => {
    const fractionalSession: ModifiedSessionResult = {
      ...baseMockSession,
      FrequencyKeyPresses: [
        {
          KeyName: 'F1',
          KeyCode: 1,
          KeyDescription: 'Key A',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.7,
          KeyType: 'Frequency',
        },
      ],
      TimerMain: 30.9,
    };

    const result = preparePlotDataCumulative(fractionalSession);

    expect(result[1].second).toBe(5); // 5.7 floored to 5
    expect(result[2].second).toBe(5); // 5.7 floored to 5
    expect(result[3].second).toBe(30); // 30.9 floored to 30
  });

  it('should handle multiple presses of same key at same time', () => {
    const sameTimeSession: ModifiedSessionResult = {
      ...baseMockSession,
      FrequencyKeyPresses: [
        {
          KeyName: 'F1',
          KeyCode: 1,
          KeyDescription: 'Key A',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'Frequency',
        },
        {
          KeyName: 'F1',
          KeyCode: 1,
          KeyDescription: 'Key A',
          KeyScheduleRecording: 'Primary',
          TimePressed: new Date('2023-01-01T10:00:05Z'),
          TimeIntoSession: 5.0,
          KeyType: 'Frequency',
        },
      ],
    };

    const result = preparePlotDataCumulative(sameTimeSession);

    expect(result).toHaveLength(6); // initial + 2*(2 presses) + final
    // Both presses should be processed, incrementing the count twice
    expect(result[4]).toEqual({ second: 5, 'Key A': 2, 'Key B': 0 });
  });

  it('should handle empty keyset frequency keys', () => {
    const emptyKeysetSession: ModifiedSessionResult = {
      ...baseMockSession,
      Keyset: {
        ...baseMockSession.Keyset,
        FrequencyKeys: [],
      },
      FrequencyKeyPresses: [],
    };

    const result = preparePlotDataCumulative(emptyKeysetSession);

    expect(result).toHaveLength(2); // initial + final
    expect(result[0]).toEqual({ second: 0 });
    expect(result[1]).toEqual({ second: 30 });
  });
});
