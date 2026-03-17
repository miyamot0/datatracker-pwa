import { prepareDataOrganization, preparePlotDataCumulative } from '../summary';
import { getLocalCachedPrefs } from '../local_storage';
import { KeySet } from '@/types/keyset';
import { ModifiedSessionResult } from '@/types/storage';
import { ScheduleMappingOptions } from '@/types/schedules';

// Mock the local_storage module
vi.mock('../local_storage', () => ({
  getLocalCachedPrefs: vi.fn(),
}));

const mockGetLocalCachedPrefs = vi.mocked(getLocalCachedPrefs);

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
  };

  const group = 'TestGroup';
  const individual = 'TestIndividual';
  const evaluation = 'TestEvaluation';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create enhanced keysets with all keys visible by default', () => {
    // Mock empty preferences (no keys to hide)
    mockGetLocalCachedPrefs.mockReturnValue({
      KeyDescription: [],
      CTBElements: [],
      Schedule: 'End on Timer #1',
    });

    const result = prepareDataOrganization(group, individual, evaluation, mockKeySet);

    expect(result.UnfilteredKeysFrequency).toHaveLength(3); // 2 freq keys + CTB
    expect(result.UnfilteredKeysDuration).toHaveLength(2); // 2 duration keys

    // Check frequency keys structure
    expect(result.UnfilteredKeysFrequency[0]).toEqual({
      KeyName: 'F1',
      KeyDescription: 'Frequency Key 1',
      KeyCode: 1,
      Visible: true,
      Type: 'Key',
    });

    // Check CTB entry
    expect(result.UnfilteredKeysFrequency[2]).toEqual({
      KeyCode: -1,
      KeyDescription: 'CTB',
      KeyName: 'CTB',
      Visible: true,
      Type: 'Summary',
    });

    // Check duration keys structure
    expect(result.UnfilteredKeysDuration[0]).toEqual({
      KeyName: 'D1',
      KeyDescription: 'Duration Key 1',
      KeyCode: 3,
      Visible: true,
      Type: 'Key',
    });
  });

  it('should hide frequency keys based on user preferences', () => {
    mockGetLocalCachedPrefs.mockImplementation((_group, _individual, _evaluation, type) => {
      if (type === 'Rate') {
        return {
          KeyDescription: ['Frequency Key 1', 'CTB'],
          CTBElements: [],
          Schedule: 'End on Timer #1',
        };
      }
      return {
        KeyDescription: [],
        CTBElements: [],
        Schedule: 'End on Timer #1',
      };
    });

    const result = prepareDataOrganization(group, individual, evaluation, mockKeySet);

    // Frequency Key 1 and CTB should be hidden
    expect(result.UnfilteredKeysFrequency[0].Visible).toBe(false);
    expect(result.UnfilteredKeysFrequency[2].Visible).toBe(false); // CTB
    expect(result.UnfilteredKeysFrequency[1].Visible).toBe(true); // Frequency Key 2
  });

  it('should hide duration keys based on user preferences', () => {
    mockGetLocalCachedPrefs.mockImplementation((_group, _individual, _evaluation, type) => {
      if (type === 'Duration') {
        return {
          KeyDescription: ['Duration Key 2'],
          CTBElements: [],
          Schedule: 'End on Timer #1',
        };
      }
      return {
        KeyDescription: [],
        CTBElements: [],
        Schedule: 'End on Timer #1',
      };
    });

    const result = prepareDataOrganization(group, individual, evaluation, mockKeySet);

    // Duration Key 2 should be hidden
    expect(result.UnfilteredKeysDuration[1].Visible).toBe(false);
    expect(result.UnfilteredKeysDuration[0].Visible).toBe(true); // Duration Key 1
  });

  it('should exclude keys from CTB based on CTBElements preferences', () => {
    mockGetLocalCachedPrefs.mockImplementation((_group, _individual, _evaluation, type) => {
      if (type === 'Rate') {
        return {
          KeyDescription: [],
          CTBElements: ['Frequency Key 1'],
          Schedule: 'End on Timer #1',
        };
      }
      return {
        KeyDescription: [],
        CTBElements: [],
        Schedule: 'End on Timer #1',
      };
    });

    const result = prepareDataOrganization(group, individual, evaluation, mockKeySet);

    // Frequency Key 1 should be excluded from CTB (visible=false in ExcludeFromCTB)
    expect(result.ExcludeFromCTB[0].Visible).toBe(false);
    expect(result.ExcludeFromCTB[1].Visible).toBe(true); // Frequency Key 2
    expect(result.ExcludeFromCTB[2].Visible).toBe(true); // CTB
  });

  it('should use the correct timer mapping from preferences', () => {
    mockGetLocalCachedPrefs.mockReturnValue({
      KeyDescription: [],
      CTBElements: [],
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
      CTBElements: [],
      Schedule: 'Invalid Schedule Option' as any,
    });

    const result = prepareDataOrganization(group, individual, evaluation, mockKeySet);

    expect(result.TimerMapping).toEqual(ScheduleMappingOptions[0]);
  });

  it('should handle empty frequency and duration keys', () => {
    const emptyKeySet: KeySet = {
      ...mockKeySet,
      FrequencyKeys: [],
      DurationKeys: [],
    };

    mockGetLocalCachedPrefs.mockReturnValue({
      KeyDescription: [],
      CTBElements: [],
      Schedule: 'End on Timer #1',
    });

    const result = prepareDataOrganization(group, individual, evaluation, emptyKeySet);

    expect(result.UnfilteredKeysFrequency).toHaveLength(1); // Only CTB
    expect(result.UnfilteredKeysDuration).toHaveLength(0);
    expect(result.ExcludeFromCTB).toHaveLength(1); // Only CTB
  });

  it('should call getLocalCachedPrefs with correct parameters', () => {
    mockGetLocalCachedPrefs.mockReturnValue({
      KeyDescription: [],
      CTBElements: [],
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
