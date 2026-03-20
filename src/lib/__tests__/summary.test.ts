import {
  prepareDataOrganization,
  preparePlotDataCumulative,
  getTimerValue,
  getTimerLabel,
  getFrequencyKeyValue,
  processObservedKeys,
  processDerivedKeys,
  buildColumnLabels,
  buildSpreadsheetData,
  processDurationKeys,
  buildDurationColumnLabels,
} from '../summary';
import { getLocalCachedPrefs } from '../local_storage';
import { KeySet } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';
import { ScheduleMappingOptions } from '@/types/schedules';
import { SessionTerminationOptions } from '@/types/terminations';
import { SavedSessionResult } from '../dtos';
import { ToggleDisplayKey } from '@/types/visuals';
import { walkSessionFrequencyKey, walkSessionDurationKey } from '../schedule-parser';
import { evaluateLogic } from '../logic';

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

const mockGetLocalCachedPrefs = vi.mocked(getLocalCachedPrefs);
const mockWalkSessionFrequencyKey = vi.mocked(walkSessionFrequencyKey);
const mockWalkSessionDurationKey = vi.mocked(walkSessionDurationKey);
const mockEvaluateLogic = vi.mocked(evaluateLogic);

// Mock data structures
const mockSavedSessionResult: SavedSessionResult = {
  Keyset: {
    id: 'test-keyset',
    Name: 'Test KeySet',
    FrequencyKeys: [
      { KeyName: 'F1', KeyDescription: 'Frequency Key 1', KeyCode: 1 },
      { KeyName: 'F2', KeyDescription: 'Frequency Key 2', KeyCode: 2 },
    ],
    DurationKeys: [{ KeyName: 'D1', KeyDescription: 'Duration Key 1', KeyCode: 3 }],
    createdAt: new Date('2023-01-01'),
    lastModified: new Date('2023-01-02'),
    DerivedKeys: [],
  },
  SessionSettings: {
    Session: 1,
    Condition: 'Test Condition',
    Initials: 'TC',
    Therapist: 'Test Therapist',
    KeySet: 'test-keyset',
    TimerOption: 'End on Timer #1',
    Role: 'Primary',
    DurationS: 1800,
  },
  SystemKeyPresses: [
    {
      KeyName: 'Primary',
      KeyCode: -1,
      KeyDescription: 'Primary',
      KeyScheduleRecording: 'Primary',
      TimePressed: new Date('2023-01-01T10:00:00Z'),
      TimeIntoSession: 0,
      KeyType: 'System',
    },
    {
      KeyName: 'Primary',
      KeyCode: -1,
      KeyDescription: 'Primary',
      KeyScheduleRecording: 'Primary',
      TimePressed: new Date('2023-01-01T10:30:00Z'),
      TimeIntoSession: 1800,
      KeyType: 'System',
    },
  ],
  TimerMain: 1800, // 30 minutes in seconds
  TimerOne: 600, // 10 minutes
  TimerTwo: 900, // 15 minutes
  TimerThree: 1200, // 20 minutes
  FrequencyKeyPresses: [],
  DurationKeyPresses: [],
  SessionStart: new Date('2023-01-01T10:00:00Z').toISOString(),
  SessionEnd: new Date('2023-01-01T10:30:00Z').toISOString(),
  EndedEarly: false,
};

const mockToggleDisplayKeys: ToggleDisplayKey[] = [
  {
    KeyName: 'F1',
    KeyDescription: 'Frequency Key 1',
    KeyCode: 1,
    KeyType: 'Observed',
    Visible: true,
  },
  {
    KeyName: 'F2',
    KeyDescription: 'Frequency Key 2',
    KeyCode: 2,
    KeyType: 'Observed',
    Visible: false,
  },
  {
    KeyName: 'D1',
    KeyDescription: 'Derived Key 1',
    KeyCode: 3,
    KeyType: 'Derived',
    Visible: true,
  },
];

describe('prepareDataOrganization', () => {
  const mockKeySet: KeySet = {
    id: 'test-keyset',
    Name: 'Test KeySet',
    FrequencyKeys: [
      { KeyName: 'F1', KeyDescription: 'Frequency Key 1', KeyCode: 1 },
      { KeyName: 'F2', KeyDescription: 'Frequency Key 2', KeyCode: 2 },
    ],
    DurationKeys: [
      { KeyName: 'D1', KeyDescription: 'Duration Key 1', KeyCode: 3 },
      { KeyName: 'D2', KeyDescription: 'Duration Key 2', KeyCode: 4 },
    ],
    createdAt: new Date('2023-01-01'),
    lastModified: new Date('2023-01-02'),
    DerivedKeys: [],
  };

  const group = 'TestGroup';
  const individual = 'TestIndividual';
  const evaluation = 'TestEvaluation';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use the correct timer mapping from preferences', () => {
    mockGetLocalCachedPrefs.mockReturnValue({
      KeyDescription: [],
      Schedule: 'End on Timer #2',
    });

    const result = prepareDataOrganization(group, individual, evaluation, mockKeySet);

    expect(result.TimerMapping).toEqual({
      value: 'End on Timer #2',
      label: 'Score Timer #2 Time',
    });
  });

  it('should use default timer mapping when preference not found', () => {
    mockGetLocalCachedPrefs.mockReturnValue({
      KeyDescription: [],
      Schedule: 'Invalid Schedule Option' as any,
    });

    const result = prepareDataOrganization(group, individual, evaluation, mockKeySet);

    expect(result.TimerMapping).toEqual(ScheduleMappingOptions[0]);
  });

  it('should call getLocalCachedPrefs with correct parameters', () => {
    mockGetLocalCachedPrefs.mockReturnValue({
      KeyDescription: [],
      Schedule: 'End on Timer #1',
    });

    prepareDataOrganization(group, individual, evaluation, mockKeySet);

    expect(mockGetLocalCachedPrefs).toHaveBeenCalledWith(group, individual, evaluation, 'Rate');
    expect(mockGetLocalCachedPrefs).toHaveBeenCalledWith(group, individual, evaluation, 'Duration');
    expect(mockGetLocalCachedPrefs).toHaveBeenCalledTimes(2);
  });
});

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
      DurationKeys: [],
      createdAt: new Date('2023-01-01'),
      lastModified: new Date('2023-01-02'),
      DerivedKeys: [],
    },
    SessionSettings: {} as any,
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

// Tests for helper functions added during refactoring
describe('getTimerValue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return correct minutes for TimerMain', () => {
    const result = getTimerValue(mockSavedSessionResult, SessionTerminationOptions.TimerMain);
    expect(result).toBe(30); // 1800 seconds / 60 = 30 minutes
  });

  it('should return correct minutes for Timer1', () => {
    const result = getTimerValue(mockSavedSessionResult, SessionTerminationOptions.Timer1);
    expect(result).toBe(10); // 600 seconds / 60 = 10 minutes
  });

  it('should return correct minutes for Timer2', () => {
    const result = getTimerValue(mockSavedSessionResult, SessionTerminationOptions.Timer2);
    expect(result).toBe(15); // 900 seconds / 60 = 15 minutes
  });

  it('should return correct minutes for Timer3', () => {
    const result = getTimerValue(mockSavedSessionResult, SessionTerminationOptions.Timer3);
    expect(result).toBe(20); // 1200 seconds / 60 = 20 minutes
  });

  it('should default to TimerMain for unknown timer option', () => {
    const result = getTimerValue(mockSavedSessionResult, 'Unknown' as any);
    expect(result).toBe(30); // Should default to TimerMain
  });
});

describe('getTimerLabel', () => {
  it('should return correct label for TimerMain', () => {
    const result = getTimerLabel(SessionTerminationOptions.TimerMain);
    expect(result).toBe('Session');
  });

  it('should return correct label for Timer1', () => {
    const result = getTimerLabel(SessionTerminationOptions.Timer1);
    expect(result).toBe('Timer #1');
  });

  it('should return correct label for Timer2', () => {
    const result = getTimerLabel(SessionTerminationOptions.Timer2);
    expect(result).toBe('Timer #2');
  });

  it('should return correct label for Timer3', () => {
    const result = getTimerLabel(SessionTerminationOptions.Timer3);
    expect(result).toBe('Timer #3');
  });

  it('should default to Session for unknown timer option', () => {
    const result = getTimerLabel('Unknown' as any);
    expect(result).toBe('Session');
  });
});

describe('getFrequencyKeyValue', () => {
  const mockKey = { KeyName: 'TestKey', KeyDescription: 'Test Key', KeyCode: 1 };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return total frequency for TimerMain', () => {
    mockWalkSessionFrequencyKey
      .mockReturnValueOnce({ KeyName: 'TestKey', KeyDescription: 'Test Key', Schedule: 'Primary', Value: 5, Bouts: -1 })
      .mockReturnValueOnce({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Secondary',
        Value: 3,
        Bouts: -1,
      })
      .mockReturnValueOnce({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Tertiary',
        Value: 2,
        Bouts: -1,
      });

    const result = getFrequencyKeyValue(mockSavedSessionResult, SessionTerminationOptions.TimerMain, mockKey);
    expect(result).toBe(10); // 5 + 3 + 2 = 10
    expect(mockWalkSessionFrequencyKey).toHaveBeenCalledTimes(3);
  });

  it('should return primary frequency for Timer1', () => {
    mockWalkSessionFrequencyKey.mockReturnValueOnce({
      KeyName: 'TestKey',
      KeyDescription: 'Test Key',
      Schedule: 'Primary',
      Value: 5,
      Bouts: -1,
    });

    const result = getFrequencyKeyValue(mockSavedSessionResult, SessionTerminationOptions.Timer1, mockKey);
    expect(result).toBe(5);
    expect(mockWalkSessionFrequencyKey).toHaveBeenCalledWith(mockSavedSessionResult, 'Primary', mockKey);
  });

  it('should return secondary frequency for Timer2', () => {
    mockWalkSessionFrequencyKey
      .mockReturnValueOnce({ KeyName: 'TestKey', KeyDescription: 'Test Key', Schedule: 'Primary', Value: 5, Bouts: -1 })
      .mockReturnValueOnce({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Secondary',
        Value: 3,
        Bouts: -1,
      });

    const result = getFrequencyKeyValue(mockSavedSessionResult, SessionTerminationOptions.Timer2, mockKey);
    expect(result).toBe(3);
  });

  it('should return tertiary frequency for Timer3', () => {
    mockWalkSessionFrequencyKey
      .mockReturnValueOnce({ KeyName: 'TestKey', KeyDescription: 'Test Key', Schedule: 'Primary', Value: 5, Bouts: -1 })
      .mockReturnValueOnce({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Secondary',
        Value: 3,
        Bouts: -1,
      })
      .mockReturnValueOnce({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Tertiary',
        Value: 2,
        Bouts: -1,
      });

    const result = getFrequencyKeyValue(mockSavedSessionResult, SessionTerminationOptions.Timer3, mockKey);
    expect(result).toBe(2);
  });
});

describe('processObservedKeys', () => {
  const mockKeySet: KeySet = {
    id: 'test-keyset',
    Name: 'Test KeySet',
    FrequencyKeys: [
      { KeyName: 'F1', KeyDescription: 'Frequency Key 1', KeyCode: 1 },
      { KeyName: 'F2', KeyDescription: 'Frequency Key 2', KeyCode: 2 },
    ],
    DurationKeys: [],
    createdAt: new Date('2023-01-01'),
    lastModified: new Date('2023-01-02'),
    DerivedKeys: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock multiple calls for different keys and schedules
    mockWalkSessionFrequencyKey.mockReturnValue({
      KeyName: 'F1',
      KeyDescription: 'Frequency Key 1',
      Schedule: 'Primary',
      Value: 5,
      Bouts: -1,
    });
  });

  it('should process visible observed keys', () => {
    const observedKeys = mockToggleDisplayKeys.filter((k) => k.KeyType === 'Observed');

    const result = processObservedKeys(
      mockSavedSessionResult,
      SessionTerminationOptions.TimerMain,
      mockKeySet,
      observedKeys,
    );

    // Should return count and rate for each visible key
    expect(result).toHaveLength(2); // One visible key = 2 entries (count + rate)
    expect(result[0].Value).toBe('15'); // Count (5 + 5 + 5 = 15 for TimerMain, 3 calls for Primary/Secondary/Tertiary)
    expect(result[1].Value).toBe('0.50'); // Rate (15 / 30 minutes)
  });

  it('should skip invisible keys', () => {
    const observedKeys = mockToggleDisplayKeys.filter((k) => k.KeyType === 'Observed');

    const result = processObservedKeys(
      mockSavedSessionResult,
      SessionTerminationOptions.TimerMain,
      mockKeySet,
      observedKeys,
    );

    // Should only process the visible key (F1), not the invisible one (F2)
    expect(result).toHaveLength(2); // Only 1 visible key
  });

  it('should throw error if key not found in keyset', () => {
    const badObservedKeys = [
      {
        ...mockToggleDisplayKeys[0],
        KeyCode: 999, // Non-existent key code
      },
    ];

    expect(() => {
      processObservedKeys(mockSavedSessionResult, SessionTerminationOptions.TimerMain, mockKeySet, badObservedKeys);
    }).toThrow('Key with KeyCode 999 not found in current session data');
  });
});

describe('processDerivedKeys', () => {
  const mockKeySet: KeySet = {
    id: 'test-keyset',
    Name: 'Test KeySet',
    FrequencyKeys: [{ KeyName: 'F1', KeyDescription: 'Frequency Key 1', KeyCode: 1 }],
    DurationKeys: [],
    createdAt: new Date('2023-01-01'),
    lastModified: new Date('2023-01-02'),
    DerivedKeys: [
      {
        name: 'D1',
        id: 'derived-1',
        initial: { type: 'constant', value: 0 },
        fields: [{ KeyCode: 1, Value: 0, KeyName: 'F1', KeyDescription: 'Frequency Key 1', Tag: 'Frequency' }],
        steps: [
          {
            id: 'step-1',
            operation: 'add',
            operand: {
              type: 'field',
              field: { KeyCode: 1, Value: 0, KeyName: 'F1', KeyDescription: 'Frequency Key 1', Tag: 'Frequency' },
            },
          },
          {
            id: 'step-2',
            operation: 'add',
            operand: { type: 'constant', value: 5 },
          },
        ],
        value: 0,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockWalkSessionFrequencyKey.mockReturnValue({
      KeyName: 'F1',
      KeyDescription: 'Frequency Key 1',
      Schedule: 'Primary',
      Value: 5,
      Bouts: -1,
    });
    mockEvaluateLogic.mockReturnValue(15);
  });

  it('should process visible derived keys', () => {
    const derivedKeys = mockToggleDisplayKeys.filter((k) => k.KeyType === 'Derived');

    const result = processDerivedKeys(
      mockSavedSessionResult,
      SessionTerminationOptions.TimerMain,
      mockKeySet,
      derivedKeys,
    );

    // Should return count and rate for derived key
    expect(result).toHaveLength(2); // count + rate
    expect(result[0].Value).toBe('15'); // Calculated value from evaluateLogic
    expect(result[1].Value).toBe('0.50'); // Rate (15 / 30 minutes)
    expect(mockEvaluateLogic).toHaveBeenCalled();
  });

  it('should skip invisible derived keys', () => {
    const derivedKeys = mockToggleDisplayKeys
      .filter((k) => k.KeyType === 'Derived')
      .map((k) => ({
        ...k,
        Visible: false,
      }));

    const result = processDerivedKeys(
      mockSavedSessionResult,
      SessionTerminationOptions.TimerMain,
      mockKeySet,
      derivedKeys,
    );

    expect(result).toHaveLength(0);
  });

  it('should throw error if logical state not found', () => {
    const badDerivedKeys = [
      {
        ...mockToggleDisplayKeys.find((k) => k.KeyType === 'Derived'),
        KeyName: 'NonExistent',
        Visible: true,
      },
    ];

    expect(() => {
      processDerivedKeys(
        mockSavedSessionResult,
        SessionTerminationOptions.TimerMain,
        mockKeySet,
        badDerivedKeys as any,
      );
    }).toThrow('Logical state not found for key NonExistent');
  });
});

describe('buildColumnLabels', () => {
  it('should build frequency column labels correctly', () => {
    const observedKeys = mockToggleDisplayKeys.filter((k) => k.KeyType === 'Observed');
    const derivedKeys = mockToggleDisplayKeys.filter((k) => k.KeyType === 'Derived');

    const result = buildColumnLabels(SessionTerminationOptions.TimerMain, observedKeys, derivedKeys);

    expect(result).toEqual([
      'Session #',
      'Date',
      'Time',
      'Condition',
      'Data Collector',
      'Therapist',
      'Duration Session (min)',
      'Frequency Key 1 (Session Count)',
      'Frequency Key 1 (Session Rate)',
      'Derived Key 1 (Derived Count)',
      'Derived Key 1 (Derived Rate)',
    ]);
  });

  it('should use timer-specific labels', () => {
    const observedKeys = mockToggleDisplayKeys.slice(0, 1).filter((k) => k.KeyType === 'Observed');

    const result = buildColumnLabels(SessionTerminationOptions.Timer1, observedKeys, []);

    expect(result[6]).toBe('Duration Timer #1 (min)');
    expect(result[7]).toBe('Frequency Key 1 (Timer #1 Count)');
    expect(result[8]).toBe('Frequency Key 1 (Timer #1 Rate)');
  });

  it('should only include visible keys', () => {
    const observedKeys = mockToggleDisplayKeys.filter((k) => k.KeyType === 'Observed');
    const derivedKeys = mockToggleDisplayKeys.filter((k) => k.KeyType === 'Derived');

    const result = buildColumnLabels(SessionTerminationOptions.TimerMain, observedKeys, derivedKeys);

    // Should only include F1 (visible), not F2 (invisible)
    expect(result).not.toContain('Frequency Key 2 (Session Count)');
    expect(result).toContain('Frequency Key 1 (Session Count)');
  });
});

describe('buildSpreadsheetData', () => {
  const mockResults = [
    {
      Session: 1,
      Date: new Date('2023-01-01T10:00:00Z'),
      Condition: 'Test',
      DataCollector: 'TC',
      Therapist: 'TT',
      duration: 30,
      Timer1: 10,
      Timer2: 15,
      Timer3: 20,
      values: [
        { Key: 'TestKey', Value: '5', KeyCode: 1 },
        { Key: 'TestKey', Value: '0.17', KeyCode: 1 },
      ],
    },
  ];

  it('should build spreadsheet data matrix correctly', () => {
    const result = buildSpreadsheetData(mockResults, SessionTerminationOptions.TimerMain);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(9); // 7 base columns + 2 value columns

    // Check base columns
    expect(result[0][0]).toEqual({ value: '1', readOnly: true });
    expect(result[0][1]?.value).toMatchSnapshot(); // Date format varies by locale
    expect(result[0][3]).toEqual({ value: 'Test', readOnly: true });
    expect(result[0][6]).toEqual({ value: '30.00', readOnly: true }); // Timer duration

    // Check value columns
    expect(result[0][7]).toEqual({ value: '5', readOnly: true });
    expect(result[0][8]).toEqual({ value: '0.17', readOnly: true });
  });

  it('should handle different timer options', () => {
    const result = buildSpreadsheetData(mockResults, SessionTerminationOptions.Timer1);
    expect(result[0][6]).toEqual({ value: '10.00', readOnly: true }); // Timer1 duration
  });
});

describe('processDurationKeys', () => {
  const filteredKeys = [
    {
      KeyName: 'D1',
      KeyDescription: 'Duration Key 1',
      KeyCode: 1,
      KeyType: 'Observed' as const,
      Type: 'Key' as const,
      Visible: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockWalkSessionDurationKey.mockReturnValue({
      KeyName: 'D1',
      KeyDescription: 'Duration Key 1',
      Schedule: 'Primary',
      Value: 300,
      Bouts: 3,
    }); // 5 minutes, 3 bouts
  });

  it('should process duration keys for TimerMain', () => {
    const result = processDurationKeys(mockSavedSessionResult, SessionTerminationOptions.TimerMain, filteredKeys);

    expect(result).toHaveLength(4); // seconds, percentage, bouts, avg bout length
    expect(result[0].Value).toBe('900.00'); // Total duration (300 * 3 = 900 seconds)
    expect(result[1].Value).toBe('50.00'); // Percentage (900 / 1800 * 100)
    expect(result[2].Value).toBe('9'); // Total bouts (3 * 3 = 9)
    expect(result[3].Value).toBe('100.00'); // Avg bout length (900 / 9)
  });

  it('should process duration keys for Timer1', () => {
    const result = processDurationKeys(mockSavedSessionResult, SessionTerminationOptions.Timer1, filteredKeys);

    expect(result[0].Value).toBe('300.00'); // Primary duration only
    expect(result[1].Value).toBe('50.00'); // Percentage (300 / 600 * 100)
    expect(result[2].Value).toBe('3'); // Primary bouts only
    expect(result[3].Value).toBe('100.00'); // Avg bout length (300 / 3)
  });

  it('should handle zero bouts correctly', () => {
    mockWalkSessionDurationKey.mockReturnValue({
      KeyName: 'D1',
      KeyDescription: 'Duration Key 1',
      Schedule: 'Primary',
      Value: 300,
      Bouts: 0,
    });
    const result = processDurationKeys(mockSavedSessionResult, SessionTerminationOptions.TimerMain, filteredKeys);

    expect(result[3].Value).toBe('0.00'); // Should handle division by zero
  });

  it('should skip invisible keys', () => {
    const invisibleKeys = [
      {
        ...filteredKeys[0],
        Visible: false,
      },
    ];

    const result = processDurationKeys(mockSavedSessionResult, SessionTerminationOptions.TimerMain, invisibleKeys);

    expect(result).toHaveLength(0);
  });
});

describe('buildDurationColumnLabels', () => {
  const filteredKeys = [
    {
      KeyName: 'D1',
      KeyDescription: 'Duration Key 1',
      KeyCode: 1,
      KeyType: 'Observed' as const,
      Type: 'Key' as const,
      Visible: true,
    },
  ];

  it('should build duration column labels for TimerMain', () => {
    const result = buildDurationColumnLabels(SessionTerminationOptions.TimerMain, filteredKeys);

    expect(result).toEqual([
      'Session #',
      'Date',
      'Time',
      'Condition',
      'Data Collector',
      'Therapist',
      'Duration Session (min)',
      'Duration Key 1 (Total Seconds)',
      'Duration Key 1 (Total Percentage)',
      'Duration Key 1 (Total Bouts)',
      'Duration Key 1 (Total Average Bout Length)',
    ]);
  });

  it('should build duration column labels for Timer1', () => {
    const result = buildDurationColumnLabels(SessionTerminationOptions.Timer1, filteredKeys);

    expect(result[6]).toBe('Duration Timer #1 (min)');
    expect(result[7]).toBe('Duration Key 1 (Timer #1 Seconds)');
    expect(result[8]).toBe('Duration Key 1 (Timer #1 Percentage)');
    expect(result[9]).toBe('Duration Key 1 (Timer #1 Bouts)');
    expect(result[10]).toBe('Duration Key 1 (Timer #1 Average Bout Length)');
  });

  it('should only include visible keys', () => {
    const mixedKeys = [...filteredKeys, { ...filteredKeys[0], KeyDescription: 'Hidden Key', Visible: false }];

    const result = buildDurationColumnLabels(SessionTerminationOptions.TimerMain, mixedKeys);

    expect(result).toContain('Duration Key 1 (Total Seconds)');
    expect(result).not.toContain('Hidden Key (Total Seconds)');
  });
});
