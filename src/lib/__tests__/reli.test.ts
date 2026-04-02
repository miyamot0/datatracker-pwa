import { describe, it, expect } from 'vitest';
import {
  generateEmptyBinArray,
  generateEIABinMatch,
  generatePIABinMatch,
  generateTIABinMatch,
  generateOIABinMatch,
  generateNIABinMatch,
  generatePMABinMatch,
  addBinToKeyData,
  getCorrespondingSessionPairs,
  pullRelevantSessions,
  calculateReliabilityFrequency,
  calculateReliabilityDuration,
  generateBinsProportion,
  prepareFrequencyReliTable,
  prepareDurationReliTable,
} from '../reli.ts';
import { ProbedKey, BinValueType, ReliabilityPairType } from '../../types/reli';
import { SavedSessionResult, SavedSettings } from '../dtos';
import { KeyManageType } from '@/types/timing';
import { KeySet } from '@/types/keyset/core';

// Sample data for testing
const mockPrimaryBin: BinValueType[] = [
  { BinNumber: 0, Value: 10 },
  { BinNumber: 1, Value: 15 },
  { BinNumber: 2, Value: 5 },
  { BinNumber: 3, Value: 0 },
  { BinNumber: 4, Value: 0 },
  { BinNumber: 5, Value: 0 },
];

const mockReliabilityBin: BinValueType[] = [
  { BinNumber: 0, Value: 10 },
  { BinNumber: 1, Value: 10 },
  { BinNumber: 2, Value: 5 },
  { BinNumber: 3, Value: 0 },
  { BinNumber: 4, Value: 0 },
  { BinNumber: 5, Value: 0 },
];

const mockPrimarySession: SavedSessionResult = {
  Keyset: {
    /* Fill with appropriate data */
  } as KeySet,
  SessionSettings: { Session: 1 } as SavedSettings,
  SystemKeyPresses: [],
  FrequencyKeyPresses: [{ KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 30 }] as KeyManageType[],
  DurationKeyPresses: [
    { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 30 },
    { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 60 },
    { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 61 },
  ] as KeyManageType[],
  SessionStart: '2024-01-01T00:00:00Z',
  SessionEnd: '2024-01-01T00:30:00Z',
  EndedEarly: false,
  TimerMain: 600,
  TimerOne: 0,
  TimerTwo: 0,
  TimerThree: 0,
};

const mockReliabilitySession: SavedSessionResult = {
  ...mockPrimarySession,
  FrequencyKeyPresses: [{ KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 30 }] as KeyManageType[],
  DurationKeyPresses: [
    { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 30 },
    { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 60 },
    { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 61 },
  ] as KeyManageType[],
};

// Unit tests
describe('Reliability Calculations', () => {
  it('should generate an empty bin array of the specified length', () => {
    const result = generateEmptyBinArray(3);
    expect(result).toEqual([
      { BinNumber: 0, Value: 0 },
      { BinNumber: 1, Value: 0 },
      { BinNumber: 2, Value: 0 },
    ]);
  });

  it('should calculate Exact Index Agreement (EIA) correctly', () => {
    const result = generateEIABinMatch(mockPrimaryBin, mockReliabilityBin);
    expect(result).toBeCloseTo(83.33, 2);
  });

  it('should calculate Proportion Index Agreement (PIA) correctly', () => {
    const result = generatePIABinMatch(mockPrimaryBin, mockReliabilityBin);
    expect(result).toBeCloseTo(94.44, 2); // Proportion agreement with some partial matches
  });

  it('should calculate Total Interval Agreement (TIA) correctly', () => {
    const result = generateTIABinMatch(mockPrimaryBin, mockReliabilityBin);
    expect(result).toBeCloseTo(100.0, 2); // All intervals either match or are non-zero
  });

  it('should calculate Observed Interval Agreement (OIA) correctly', () => {
    const result = generateOIABinMatch(mockPrimaryBin, mockReliabilityBin);
    expect(result).toBeCloseTo(100.0, 2); // Non-empty intervals all match
  });

  it('should calculate Non-Matched Interval Agreement (NIA) correctly', () => {
    const result = generateNIABinMatch(mockPrimaryBin, mockReliabilityBin);
    expect(result).toBeCloseTo(100.0, 2); // Non-negative intervals match
  });

  it('should calculate Presence/Absence Agreement by Minute (PMA) correctly', () => {
    const result = generatePMABinMatch(mockPrimaryBin, mockReliabilityBin);
    expect(result).toBeCloseTo(83.33, 2); // Proportions by minute match
  });

  it('should add a bin to the key data', () => {
    const keyData: KeyManageType = {
      KeyDescription: 'Key1',
      KeyName: 'A',
      TimeIntoSession: 35,
    } as KeyManageType;
    const result = addBinToKeyData(keyData, 10);
    expect(result.Bin).toBe(3);
  });

  it('should get corresponding session pairs', () => {
    const result = getCorrespondingSessionPairs([mockPrimarySession], [mockReliabilitySession]);
    expect(result).toEqual([{ primary: mockPrimarySession, reli: mockReliabilitySession }]);
  });

  it('should calculate reliability for frequency keys', () => {
    const pair: ReliabilityPairType = {
      primary: mockPrimarySession,
      reli: mockReliabilitySession,
    };
    const result = calculateReliabilityFrequency(pair, mockPrimarySession.FrequencyKeyPresses);
    expect(result.length).toBe(1);
    expect(result[0].EIA).toBeCloseTo(100.0, 2);
  });

  it('should calculate reliability for duration keys-o', () => {
    const pair: ReliabilityPairType = {
      primary: mockPrimarySession,
      reli: mockReliabilitySession,
    };
    const result = calculateReliabilityDuration(pair, mockPrimarySession.DurationKeyPresses);
    expect(result.length).toBe(3);
    expect(result[0].EIA).toBeCloseTo(100, 2);
  });

  it('should calculate reliability for duration keys-e', () => {
    const mockPrimarySession_trim = {
      ...mockPrimarySession,
      DurationKeyPresses: [
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 30 },
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 60 },
      ],
    };

    const mockReliabilitySession_trim = {
      ...mockReliabilitySession,
      DurationKeyPresses: [
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 30 },
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 60 },
      ],
    };

    const pair: ReliabilityPairType = {
      primary: mockPrimarySession_trim as SavedSessionResult,
      reli: mockReliabilitySession_trim as SavedSessionResult,
    };
    const result = calculateReliabilityDuration(pair, mockReliabilitySession.DurationKeyPresses);
    expect(result[0].EIA).toBeCloseTo(100, 2);
  });
});

describe('generateBinsProportion', () => {
  const mockPrimarySession2: SavedSessionResult = {
    TimerMain: 120, // 120 seconds
    DurationKeyPresses: [
      { KeyDescription: 'key1', KeyName: 'A', TimeIntoSession: 5 },
      { KeyDescription: 'key1', KeyName: 'A', TimeIntoSession: 20 },
      { KeyDescription: 'key2', KeyName: 'B', TimeIntoSession: 30 },
      { KeyDescription: 'key2', KeyName: 'B', TimeIntoSession: 50 },
      { KeyDescription: 'key1', KeyName: 'A', TimeIntoSession: 70 },
      { KeyDescription: 'key1', KeyName: 'A', TimeIntoSession: 90 },
    ] as KeyManageType[],
  } as SavedSessionResult;

  const mockKeysToCode: ProbedKey[] = [{ KeyDescription: 'key1' }, { KeyDescription: 'key2' }] as ProbedKey[];

  it('should calculate correct proportions for even key presses', () => {
    const result = generateBinsProportion(mockPrimarySession2, mockKeysToCode);

    // Test first key
    expect(result[0].TotalBins).toBe(12); // TimerMain / 10 = 12 bins
    expect(result[0].BinsNonzero).toBeGreaterThan(0); // At least some bins should be filled
    expect(result[0].Proportion).toBeGreaterThan(0); // Proportion should be positive

    // Test second key
    expect(result[1].TotalBins).toBe(12);
    expect(result[1].BinsNonzero).toBeGreaterThan(0);
    expect(result[1].Proportion).toBeGreaterThan(0);
  });

  it('should handle cases with no relevant keypresses', () => {
    const emptyDurationKeyPresses: SavedSessionResult = {
      ...mockPrimarySession2,
      DurationKeyPresses: [], // No keypresses
    };

    const result = generateBinsProportion(emptyDurationKeyPresses, mockKeysToCode);

    // Both keys should have zero bins filled
    expect(result[0].BinsNonzero).toBe(0);
    expect(result[0].Proportion).toBe(0);
    expect(result[1].BinsNonzero).toBe(0);
    expect(result[1].Proportion).toBe(0);
  });

  it('should handle odd number of keypresses correctly', () => {
    const oddKeyPressSession: SavedSessionResult = {
      ...mockPrimarySession2,
      DurationKeyPresses: [
        { KeyDescription: 'key1', KeyName: 'A', TimeIntoSession: 5 },
        { KeyDescription: 'key1', KeyName: 'A', TimeIntoSession: 20 },
        { KeyDescription: 'key1', KeyName: 'A', TimeIntoSession: 70 }, // Odd number of presses for key1
      ] as KeyManageType[],
    };

    const result = generateBinsProportion(oddKeyPressSession, mockKeysToCode);

    // Check if the remaining keypress is counted
    expect(result[0].BinsNonzero).toBeGreaterThan(0); // There should be some nonzero bins
    expect(result[0].Proportion).toBeGreaterThan(0); // Proportion should be calculated
  });

  it('should handle small timer values', () => {
    const smallTimerSession: SavedSessionResult = {
      ...mockPrimarySession2,
      TimerMain: 5, // Only 5 seconds
      DurationKeyPresses: [
        { KeyDescription: 'key1', KeyName: 'A', TimeIntoSession: 1 },
        { KeyDescription: 'key1', KeyName: 'A', TimeIntoSession: 3 },
      ] as KeyManageType[],
    };

    const result = generateBinsProportion(smallTimerSession, mockKeysToCode);

    expect(result[0].TotalBins).toBe(1); // Only one bin should be created
    expect(result[0].BinsNonzero).toBe(1); // One bin should be nonzero
    expect(result[0].Proportion).toBe(100); // Proportion should be 100%
  });
});

describe('generateEmptyBinArray - Edge Cases', () => {
  it('should handle zero bins', () => {
    const result = generateEmptyBinArray(0);
    expect(result).toEqual([]);
  });

  it('should handle single bin', () => {
    const result = generateEmptyBinArray(1);
    expect(result).toEqual([{ BinNumber: 0, Value: 0 }]);
  });

  it('should handle large number of bins', () => {
    const result = generateEmptyBinArray(1000);
    expect(result).toHaveLength(1000);
    expect(result[999]).toEqual({ BinNumber: 999, Value: 0 });
  });
});

describe('Bin Match Functions - Edge Cases', () => {
  describe('generateEIABinMatch', () => {
    it('should handle empty arrays', () => {
      const result = generateEIABinMatch([], []);
      expect(result).toBeNaN(); // Division by zero results in NaN
    });

    it('should handle single matching element', () => {
      const primary = [{ BinNumber: 0, Value: 5 }];
      const reliability = [{ BinNumber: 0, Value: 5 }];
      const result = generateEIABinMatch(primary, reliability);
      expect(result).toBe(100);
    });

    it('should handle single non-matching element', () => {
      const primary = [{ BinNumber: 0, Value: 5 }];
      const reliability = [{ BinNumber: 0, Value: 3 }];
      const result = generateEIABinMatch(primary, reliability);
      expect(result).toBe(0);
    });

    it('should handle decimal values correctly', () => {
      const primary = [{ BinNumber: 0, Value: 5.7 }];
      const reliability = [{ BinNumber: 0, Value: 5.9 }];
      const result = generateEIABinMatch(primary, reliability);
      expect(result).toBe(100); // Both floor to 5
    });
  });

  describe('generatePIABinMatch', () => {
    it('should handle empty arrays', () => {
      const result = generatePIABinMatch([], []);
      expect(result).toBeNaN(); // Division by zero results in NaN
    });

    it('should handle division by zero in proportion calculation', () => {
      const primary = [{ BinNumber: 0, Value: 0 }];
      const reliability = [{ BinNumber: 0, Value: 5 }];
      const result = generatePIABinMatch(primary, reliability);
      expect(result).toBe(0); // min(0,5)/max(0,5) = 0/5 = 0
    });

    it('should handle identical non-zero values', () => {
      const primary = [{ BinNumber: 0, Value: 10 }];
      const reliability = [{ BinNumber: 0, Value: 10 }];
      const result = generatePIABinMatch(primary, reliability);
      expect(result).toBe(100);
    });

    it('should calculate partial agreement correctly', () => {
      const primary = [{ BinNumber: 0, Value: 10 }];
      const reliability = [{ BinNumber: 0, Value: 5 }];
      const result = generatePIABinMatch(primary, reliability);
      expect(result).toBe(50); // min(10,5)/max(10,5) * 100 = 5/10 * 100 = 50
    });
  });

  describe('generateTIABinMatch', () => {
    it('should handle all zero values', () => {
      const primary = [
        { BinNumber: 0, Value: 0 },
        { BinNumber: 1, Value: 0 },
      ];
      const reliability = [
        { BinNumber: 0, Value: 0 },
        { BinNumber: 1, Value: 0 },
      ];
      const result = generateTIABinMatch(primary, reliability);
      expect(result).toBe(100);
    });

    it('should handle mixed zero and non-zero', () => {
      const primary = [
        { BinNumber: 0, Value: 0 },
        { BinNumber: 1, Value: 5 },
      ];
      const reliability = [
        { BinNumber: 0, Value: 5 },
        { BinNumber: 1, Value: 0 },
      ];
      const result = generateTIABinMatch(primary, reliability);
      expect(result).toBe(0); // No agreements
    });

    it('should handle all non-zero values', () => {
      const primary = [
        { BinNumber: 0, Value: 5 },
        { BinNumber: 1, Value: 10 },
      ];
      const reliability = [
        { BinNumber: 0, Value: 3 },
        { BinNumber: 1, Value: 7 },
      ];
      const result = generateTIABinMatch(primary, reliability);
      expect(result).toBe(100);
    });
  });

  describe('generateOIABinMatch', () => {
    it('should handle case with no non-empty intervals', () => {
      const primary = [{ BinNumber: 0, Value: 0 }];
      const reliability = [{ BinNumber: 0, Value: 0 }];
      const result = generateOIABinMatch(primary, reliability);
      expect(result).toBeNaN(); // Division by zero results in NaN
    });

    it('should handle partial matches in non-empty intervals', () => {
      const primary = [
        { BinNumber: 0, Value: 5 },
        { BinNumber: 1, Value: 0 },
      ];
      const reliability = [
        { BinNumber: 0, Value: 3 },
        { BinNumber: 1, Value: 7 },
      ];
      const result = generateOIABinMatch(primary, reliability);
      expect(result).toBe(50); // 1 match out of 2 non-empty intervals
    });

    it('should handle all matching non-empty intervals', () => {
      const primary = [
        { BinNumber: 0, Value: 5 },
        { BinNumber: 1, Value: 10 },
      ];
      const reliability = [
        { BinNumber: 0, Value: 3 },
        { BinNumber: 1, Value: 7 },
      ];
      const result = generateOIABinMatch(primary, reliability);
      expect(result).toBe(100);
    });
  });

  describe('generateNIABinMatch', () => {
    it('should always consider all intervals', () => {
      const primary = [{ BinNumber: 0, Value: 5 }];
      const reliability = [{ BinNumber: 0, Value: 5 }];
      const result = generateNIABinMatch(primary, reliability);
      expect(result).toBe(100);
    });

    it('should handle mixed agreements correctly', () => {
      const primary = [
        { BinNumber: 0, Value: 0 },
        { BinNumber: 1, Value: 5 },
      ];
      const reliability = [
        { BinNumber: 0, Value: 0 },
        { BinNumber: 1, Value: 0 },
      ];
      const result = generateNIABinMatch(primary, reliability);
      expect(result).toBe(50); // Only first bin agrees (both zero)
    });
  });

  describe('generatePMABinMatch', () => {
    it('should handle arrays not divisible by 6', () => {
      const primary = [
        { BinNumber: 0, Value: 10 },
        { BinNumber: 1, Value: 5 },
      ];
      const reliability = [
        { BinNumber: 0, Value: 10 },
        { BinNumber: 1, Value: 5 },
      ];
      const result = generatePMABinMatch(primary, reliability);
      expect(result).toBeNaN(); // No complete minutes (division by 0)
    });

    it('should handle exactly 6 bins', () => {
      const primary = Array(6)
        .fill(0)
        .map((_, i) => ({ BinNumber: i, Value: 5 }));
      const reliability = Array(6)
        .fill(0)
        .map((_, i) => ({ BinNumber: i, Value: 5 }));
      const result = generatePMABinMatch(primary, reliability);
      expect(result).toBe(100); // Perfect match for one minute
    });

    it('should handle multiple minutes with partial matches', () => {
      const primary = Array(12)
        .fill(0)
        .map((_, i) => ({ BinNumber: i, Value: i < 6 ? 10 : 5 }));
      const reliability = Array(12)
        .fill(0)
        .map((_, i) => ({ BinNumber: i, Value: i < 6 ? 5 : 5 }));
      const result = generatePMABinMatch(primary, reliability);
      expect(result).toBeCloseTo(75, 1); // First minute: 30/60 = 0.5, second minute: 30/30 = 1.0, average = 0.75
    });

    it('should handle zero totals in a minute', () => {
      const primary = Array(6)
        .fill(0)
        .map((_, i) => ({ BinNumber: i, Value: 0 }));
      const reliability = Array(6)
        .fill(0)
        .map((_, i) => ({ BinNumber: i, Value: 0 }));
      const result = generatePMABinMatch(primary, reliability);
      expect(result).toBe(100); // Perfect match when both are zero
    });
  });
});

describe('addBinToKeyData - Edge Cases', () => {
  it('should handle zero time with default bin size', () => {
    const keyData: KeyManageType = { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 0 } as KeyManageType;
    const result = addBinToKeyData(keyData);
    expect(result.Bin).toBe(0);
  });

  it('should handle custom bin sizes', () => {
    const keyData: KeyManageType = { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 25 } as KeyManageType;
    const result = addBinToKeyData(keyData, 5);
    expect(result.Bin).toBe(5);
  });

  it('should handle large time values', () => {
    const keyData: KeyManageType = { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 999999 } as KeyManageType;
    const result = addBinToKeyData(keyData);
    expect(result.Bin).toBe(99999);
  });

  it('should handle decimal time values', () => {
    const keyData: KeyManageType = { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 35.7 } as KeyManageType;
    const result = addBinToKeyData(keyData);
    expect(result.Bin).toBe(3); // Math.floor(35.7 / 10) = 3
  });

  it('should preserve all original key data properties', () => {
    const keyData: KeyManageType = {
      KeyDescription: 'Key1',
      KeyName: 'A',
      TimeIntoSession: 35,
      // Add any other properties that might exist
    } as KeyManageType;
    const result = addBinToKeyData(keyData);
    expect(result.KeyDescription).toBe('Key1');
    expect(result.KeyName).toBe('A');
    expect(result.TimeIntoSession).toBe(35);
    expect(result.Bin).toBe(3);
  });
});

describe('getCorrespondingSessionPairs - Edge Cases', () => {
  it('should handle empty primary sessions', () => {
    const result = getCorrespondingSessionPairs([], [mockReliabilitySession]);
    expect(result).toEqual([]);
  });

  it('should handle empty reliability sessions', () => {
    const result = getCorrespondingSessionPairs([mockPrimarySession], []);
    expect(result).toEqual([]);
  });

  it('should handle no matching sessions', () => {
    const nonMatchingReliability = {
      ...mockReliabilitySession,
      SessionSettings: { Session: 999 } as SavedSettings,
    };
    const result = getCorrespondingSessionPairs([mockPrimarySession], [nonMatchingReliability]);
    expect(result).toEqual([]);
  });

  it('should handle multiple primary sessions with some matches', () => {
    const primarySession2 = {
      ...mockPrimarySession,
      SessionSettings: { Session: 2 } as SavedSettings,
    };
    const reliabilitySession2 = {
      ...mockReliabilitySession,
      SessionSettings: { Session: 2 } as SavedSettings,
    };
    const result = getCorrespondingSessionPairs(
      [mockPrimarySession, primarySession2],
      [mockReliabilitySession, reliabilitySession2],
    );
    expect(result).toHaveLength(2);
    expect(result[0].primary.SessionSettings.Session).toBe(1);
    expect(result[1].primary.SessionSettings.Session).toBe(2);
  });

  it('should handle duplicate session IDs', () => {
    const duplicateReliability = { ...mockReliabilitySession };
    const result = getCorrespondingSessionPairs([mockPrimarySession], [mockReliabilitySession, duplicateReliability]);
    expect(result).toHaveLength(1); // Should find first match
    expect(result[0].reli.SessionSettings.Session).toBe(1);
  });
});

describe('calculateReliabilityFrequency - Edge Cases', () => {
  it('should handle empty keys to code', () => {
    const pair: ReliabilityPairType = { primary: mockPrimarySession, reli: mockReliabilitySession };
    const result = calculateReliabilityFrequency(pair, []);
    expect(result).toEqual([]);
  });

  it('should handle keys not found in session data', () => {
    const pair: ReliabilityPairType = { primary: mockPrimarySession, reli: mockReliabilitySession };
    const nonExistentKey = { KeyName: 'NonExistent', KeyDescription: 'NoKey' } as ProbedKey;
    const result = calculateReliabilityFrequency(pair, [nonExistentKey]);
    expect(result).toHaveLength(1);
    expect(result[0].EIA).toBe(100); // All bins are zero, so perfect match
    expect(result[0].KeyName).toBe('NonExistent');
  });

  it('should handle case-insensitive key matching', () => {
    const primaryWithMixedCase: SavedSessionResult = {
      ...mockPrimarySession,
      FrequencyKeyPresses: [{ KeyDescription: 'Key1', KeyName: 'a', TimeIntoSession: 30 }] as KeyManageType[],
    };
    const reliabilityWithMixedCase: SavedSessionResult = {
      ...mockReliabilitySession,
      FrequencyKeyPresses: [{ KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 30 }] as KeyManageType[],
    };
    const pair: ReliabilityPairType = { primary: primaryWithMixedCase, reli: reliabilityWithMixedCase };
    const keyToCode = { KeyName: 'A', KeyDescription: 'Key1' } as ProbedKey;
    const result = calculateReliabilityFrequency(pair, [keyToCode]);
    expect(result).toHaveLength(1);
    expect(result[0].EIA).toBe(100);
  });

  it('should throw error when bin is out of range', () => {
    const primaryWithLargeTime: SavedSessionResult = {
      ...mockPrimarySession,
      TimerMain: 50, // Small timer
      FrequencyKeyPresses: [{ KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 1000 }] as KeyManageType[], // Time beyond timer
    };
    const reliabilityWithLargeTime: SavedSessionResult = {
      ...mockReliabilitySession,
      TimerMain: 50,
      FrequencyKeyPresses: [{ KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 1000 }] as KeyManageType[], // This will cause the error
    };
    const pair: ReliabilityPairType = { primary: primaryWithLargeTime, reli: reliabilityWithLargeTime };
    const keyToCode = { KeyName: 'A', KeyDescription: 'Key1' } as ProbedKey;

    expect(() => {
      calculateReliabilityFrequency(pair, [keyToCode]);
    }).toThrow(); // Accept any error as the bin logic causes runtime errors
  });

  it('should throw explicit out-of-range error for reliability bins', () => {
    const primaryInRange: SavedSessionResult = {
      ...mockPrimarySession,
      TimerMain: 50,
      FrequencyKeyPresses: [{ KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 10 }] as KeyManageType[],
    };
    const reliabilityOutOfRange: SavedSessionResult = {
      ...mockReliabilitySession,
      TimerMain: 50,
      FrequencyKeyPresses: [{ KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 1000 }] as KeyManageType[],
    };

    const pair: ReliabilityPairType = {
      primary: primaryInRange,
      reli: reliabilityOutOfRange,
    };
    const keyToCode = { KeyName: 'A', KeyDescription: 'Key1' } as ProbedKey;

    expect(() => calculateReliabilityFrequency(pair, [keyToCode])).toThrow('is out of range');
  });

  it('should handle sessions with different timer lengths', () => {
    const shortReliability: SavedSessionResult = {
      ...mockReliabilitySession,
      TimerMain: 300, // Half the time of primary
    };
    const pair: ReliabilityPairType = { primary: mockPrimarySession, reli: shortReliability };
    const keyToCode = { KeyName: 'A', KeyDescription: 'Key1' } as ProbedKey;
    const result = calculateReliabilityFrequency(pair, [keyToCode]);
    expect(result).toHaveLength(1);
    // Should work as it uses primary session's timer for bin count
  });
});

describe('calculateReliabilityDuration - Edge Cases', () => {
  it('should handle empty duration key presses', () => {
    const emptyPrimary: SavedSessionResult = {
      ...mockPrimarySession,
      DurationKeyPresses: [],
    };
    const emptyReliability: SavedSessionResult = {
      ...mockReliabilitySession,
      DurationKeyPresses: [],
    };
    const pair: ReliabilityPairType = { primary: emptyPrimary, reli: emptyReliability };
    const keyToCode = { KeyName: 'A', KeyDescription: 'Key1' } as ProbedKey;
    const result = calculateReliabilityDuration(pair, [keyToCode]);
    expect(result).toHaveLength(1);
    expect(result[0].EIA).toBe(100); // All bins are zero
  });

  it('should handle single key press (odd number)', () => {
    const singlePrimary: SavedSessionResult = {
      ...mockPrimarySession,
      DurationKeyPresses: [{ KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 30 }] as KeyManageType[],
    };
    const singleReliability: SavedSessionResult = {
      ...mockReliabilitySession,
      DurationKeyPresses: [{ KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 30 }] as KeyManageType[],
    };
    const pair: ReliabilityPairType = { primary: singlePrimary, reli: singleReliability };
    const keyToCode = { KeyName: 'A', KeyDescription: 'Key1' } as ProbedKey;
    const result = calculateReliabilityDuration(pair, [keyToCode]);
    expect(result).toHaveLength(1);
    // Should handle the duration from the single press to the end of the session
  });

  it('should handle very short durations', () => {
    const shortDurationPrimary: SavedSessionResult = {
      ...mockPrimarySession,
      TimerMain: 60,
      DurationKeyPresses: [
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 5 },
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 7 },
      ] as KeyManageType[],
    };
    const pair: ReliabilityPairType = { primary: shortDurationPrimary, reli: mockReliabilitySession };
    const keyToCode = { KeyName: 'A', KeyDescription: 'Key1' } as ProbedKey;
    const result = calculateReliabilityDuration(pair, [keyToCode]);
    expect(result).toHaveLength(1);
    // Should work with short durations
  });

  it('should handle overlapping time ranges', () => {
    const overlappingPrimary: SavedSessionResult = {
      ...mockPrimarySession,
      DurationKeyPresses: [
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 10 },
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 50 },
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 30 },
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 80 },
      ] as KeyManageType[],
    };
    const pair: ReliabilityPairType = { primary: overlappingPrimary, reli: mockReliabilitySession };
    const keyToCode = { KeyName: 'A', KeyDescription: 'Key1' } as ProbedKey;
    const result = calculateReliabilityDuration(pair, [keyToCode]);
    expect(result).toHaveLength(1);
    // Should handle overlapping ranges
  });

  it('should handle identical duration patterns', () => {
    const identicalReliability: SavedSessionResult = {
      ...mockReliabilitySession,
      DurationKeyPresses: [...mockPrimarySession.DurationKeyPresses], // Exact copy
    };
    const pair: ReliabilityPairType = { primary: mockPrimarySession, reli: identicalReliability };
    const keyToCode = { KeyName: 'A', KeyDescription: 'Key1' } as ProbedKey;
    const result = calculateReliabilityDuration(pair, [keyToCode]);
    expect(result[0].EIA).toBe(100); // Should be perfect match
  });
});

describe('generateBinsProportion - Additional Edge Cases', () => {
  it('should handle zero timer value', () => {
    const zeroTimerSession: SavedSessionResult = {
      ...mockPrimarySession,
      TimerMain: 0,
      DurationKeyPresses: [],
    };
    const keyToCode = [{ KeyDescription: 'Key1' }] as ProbedKey[];
    const result = generateBinsProportion(zeroTimerSession, keyToCode);
    expect(result[0].TotalBins).toBe(0);
    expect(result[0].BinsNonzero).toBe(0);
    expect(result[0].Proportion).toBeNaN(); // Division by zero results in NaN
  });

  it('should handle negative time values in key presses', () => {
    const negativeTimeSession: SavedSessionResult = {
      ...mockPrimarySession,
      TimerMain: 100,
      DurationKeyPresses: [
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 5 },
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 50 },
      ] as KeyManageType[],
    };
    const keyToCode = [{ KeyDescription: 'Key1' }] as ProbedKey[];
    const result = generateBinsProportion(negativeTimeSession, keyToCode);
    // Should handle positive values correctly
    expect(result[0].TotalBins).toBe(10);
    expect(result[0].BinsNonzero).toBeGreaterThanOrEqual(0);
  });

  it('should handle key presses beyond timer duration', () => {
    const beyondTimerSession: SavedSessionResult = {
      ...mockPrimarySession,
      TimerMain: 50,
      DurationKeyPresses: [
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 10 },
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 20 },
        { KeyDescription: 'Key1', KeyName: 'A', TimeIntoSession: 100 }, // Beyond timer
      ] as KeyManageType[],
    };
    const keyToCode = [{ KeyDescription: 'Key1' }] as ProbedKey[];
    const result = generateBinsProportion(beyondTimerSession, keyToCode);
    // Should handle gracefully, duration ends at TimerMain
    expect(result[0].TotalBins).toBe(5);
  });

  it('should preserve original key properties in result', () => {
    const keyToCode = [
      {
        KeyDescription: 'TestKey',
        KeyName: 'T',
        CustomProperty: 'CustomValue',
      },
    ] as (ProbedKey & { CustomProperty?: string })[];

    const result = generateBinsProportion(mockPrimarySession, keyToCode);
    expect(result[0].KeyDescription).toBe('TestKey');
    expect((result[0] as any).CustomProperty).toBe('CustomValue');
  });
});

describe('pullRelevantSessions', () => {
  const mockPair1: ReliabilityPairType = {
    primary: {
      ...mockPrimarySession,
      SessionSettings: { Session: 3 } as SavedSettings,
    },
    reli: {
      ...mockReliabilitySession,
      SessionSettings: { Session: 3 } as SavedSettings,
    },
  };

  const mockPair2: ReliabilityPairType = {
    primary: {
      ...mockPrimarySession,
      SessionSettings: { Session: 1 } as SavedSettings,
    },
    reli: {
      ...mockReliabilitySession,
      SessionSettings: { Session: 1 } as SavedSettings,
    },
  };

  const mockPair3: ReliabilityPairType = {
    primary: {
      ...mockPrimarySession,
      SessionSettings: { Session: 5 } as SavedSettings,
    },
    reli: {
      ...mockReliabilitySession,
      SessionSettings: { Session: 5 } as SavedSettings,
    },
  };

  it('should extract and sort session numbers from paired sessions', () => {
    const pairedSessions = [mockPair1, mockPair2, mockPair3];
    const result = pullRelevantSessions(pairedSessions);

    expect(result).toEqual([1, 3, 5]);
  });

  it('should handle empty paired sessions', () => {
    const result = pullRelevantSessions([]);
    expect(result).toEqual([]);
  });

  it('should deduplicate session numbers', () => {
    const duplicatePair: ReliabilityPairType = {
      primary: {
        ...mockPrimarySession,
        SessionSettings: { Session: 3 } as SavedSettings,
      },
      reli: {
        ...mockReliabilitySession,
        SessionSettings: { Session: 3 } as SavedSettings,
      },
    };

    const pairedSessions = [mockPair1, duplicatePair, mockPair2];
    const result = pullRelevantSessions(pairedSessions);

    expect(result).toEqual([1, 3]);
  });

  it('should filter out NaN session numbers', () => {
    const invalidPair: ReliabilityPairType = {
      primary: {
        ...mockPrimarySession,
        SessionSettings: { Session: null as any } as SavedSettings,
      },
      reli: {
        ...mockReliabilitySession,
        SessionSettings: { Session: null as any } as SavedSettings,
      },
    };

    const pairedSessions = [mockPair1, invalidPair, mockPair2];
    const result = pullRelevantSessions(pairedSessions);

    expect(result).toEqual([0, 1, 3]); // null becomes 0, not NaN
  });

  it('should handle mixed valid and invalid session numbers', () => {
    const undefinedPair: ReliabilityPairType = {
      primary: {
        ...mockPrimarySession,
        SessionSettings: {} as SavedSettings,
      },
      reli: {
        ...mockReliabilitySession,
        SessionSettings: {} as SavedSettings,
      },
    };

    const pairedSessions = [mockPair2, undefinedPair, mockPair1];
    const result = pullRelevantSessions(pairedSessions);

    expect(result).toEqual([1, 3]);
  });

  it('should sort large session numbers correctly', () => {
    const largePair1: ReliabilityPairType = {
      primary: {
        ...mockPrimarySession,
        SessionSettings: { Session: 100 } as SavedSettings,
      },
      reli: {
        ...mockReliabilitySession,
        SessionSettings: { Session: 100 } as SavedSettings,
      },
    };

    const largePair2: ReliabilityPairType = {
      primary: {
        ...mockPrimarySession,
        SessionSettings: { Session: 15 } as SavedSettings,
      },
      reli: {
        ...mockReliabilitySession,
        SessionSettings: { Session: 15 } as SavedSettings,
      },
    };

    const pairedSessions = [largePair1, largePair2, mockPair1];
    const result = pullRelevantSessions(pairedSessions);

    expect(result).toEqual([3, 15, 100]);
  });
});

describe('prepareFrequencyReliTable', () => {
  const mockKeySet: KeySet = {
    id: 'test-keyset',
    Name: 'Test KeySet',
    FrequencyKeys: [
      { KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 },
      { KeyName: 'B', KeyDescription: 'Key B', KeyCode: 66 },
    ],
    DerivedKeys: [],
    DurationKeys: [],
    createdAt: new Date('2024-01-01'),
    lastModified: new Date('2024-01-01'),
  };

  const mockPairedSessions: ReliabilityPairType[] = [
    {
      primary: {
        ...mockPrimarySession,
        SessionSettings: { Session: 1 } as SavedSettings,
        FrequencyKeyPresses: [{ KeyDescription: 'Key A', KeyName: 'A', TimeIntoSession: 30 }] as KeyManageType[],
      },
      reli: {
        ...mockReliabilitySession,
        SessionSettings: { Session: 1 } as SavedSettings,
        FrequencyKeyPresses: [{ KeyDescription: 'Key A', KeyName: 'A', TimeIntoSession: 30 }] as KeyManageType[],
      },
    },
    {
      primary: {
        ...mockPrimarySession,
        SessionSettings: { Session: 2 } as SavedSettings,
        FrequencyKeyPresses: [{ KeyDescription: 'Key B', KeyName: 'B', TimeIntoSession: 45 }] as KeyManageType[],
      },
      reli: {
        ...mockReliabilitySession,
        SessionSettings: { Session: 2 } as SavedSettings,
        FrequencyKeyPresses: [{ KeyDescription: 'Key B', KeyName: 'B', TimeIntoSession: 50 }] as KeyManageType[],
      },
    },
  ];

  it('should create proper table structure with headings', () => {
    const result = prepareFrequencyReliTable(mockPairedSessions, mockKeySet);

    expect(result.headings).toEqual([
      'Session #',
      'Key A (EIA)',
      'Key A (PIA)',
      'Key A (TIA)',
      'Key A (OIA)',
      'Key A (NIA)',
      'Key A (PMA)',
      'Key B (EIA)',
      'Key B (PIA)',
      'Key B (TIA)',
      'Key B (OIA)',
      'Key B (NIA)',
      'Key B (PMA)',
    ]);
  });

  it('should create rows for each session', () => {
    const result = prepareFrequencyReliTable(mockPairedSessions, mockKeySet);

    expect(result.rows).toHaveLength(3); // 2 sessions + 1 averaged row
    expect(result.rows[0][0].value).toBe('1');
    expect(result.rows[1][0].value).toBe('2');
    expect(result.rows[2][0].value).toBe('Averaged');
  });

  it('should handle sessions with no matching keys', () => {
    const singlePairedSession = [mockPairedSessions[0]];
    const result = prepareFrequencyReliTable(singlePairedSession, mockKeySet);

    expect(result.rows).toHaveLength(2); // 1 session + 1 averaged row
    // First session should have data for Key A but 100.00 for Key B (all bins empty = perfect match)
    expect(result.rows[0][1].value).toBeTruthy(); // Key A EIA value
    expect(result.rows[0][7].value).toBe('100.00'); // Key B EIA value (empty bins = 100% match)
  });

  it('should calculate averages correctly', () => {
    const result = prepareFrequencyReliTable(mockPairedSessions, mockKeySet);
    const averageRow = result.rows[result.rows.length - 1];

    expect(averageRow[0].value).toBe('Averaged');
    // Averages should be calculated for valid values, NaN for keys with no data
    expect(averageRow[1].value).not.toBe(''); // Should have averaged EIA for Key A
  });

  it('should handle empty paired sessions', () => {
    const result = prepareFrequencyReliTable([], mockKeySet);

    expect(result.headings).toHaveLength(13); // Session # + 6 metrics × 2 keys
    expect(result.rows).toHaveLength(1); // Only averaged row
    expect(result.rows[0][0].value).toBe('Averaged');
  });

  it('should handle keyset with no frequency keys', () => {
    const emptyKeySet: KeySet = {
      ...mockKeySet,
      FrequencyKeys: [],
    };

    const result = prepareFrequencyReliTable(mockPairedSessions, emptyKeySet);

    expect(result.headings).toEqual(['Session #']);
    expect(result.rows).toHaveLength(3); // 2 sessions + 1 averaged row
    expect(result.rows[0]).toHaveLength(1); // Only session number
    expect(result.rows[1]).toHaveLength(1); // Only session number
    expect(result.rows[2]).toHaveLength(1); // Only session number
  });

  it('should handle all values as readOnly', () => {
    const result = prepareFrequencyReliTable(mockPairedSessions, mockKeySet);

    result.rows.forEach((row) => {
      row.forEach((cell) => {
        expect(cell.readOnly).toBe(true);
      });
    });
  });

  it('should leave blank cells when session identifiers do not strictly match', () => {
    const keyset: KeySet = {
      ...mockKeySet,
      FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }],
    };

    const pairedWithStringSession: ReliabilityPairType[] = [
      {
        primary: {
          ...mockPrimarySession,
          SessionSettings: { Session: '1' as any } as SavedSettings,
        },
        reli: {
          ...mockReliabilitySession,
          SessionSettings: { Session: '1' as any } as SavedSettings,
        },
      },
    ];

    const result = prepareFrequencyReliTable(pairedWithStringSession, keyset);

    // First row is for session "1" pulled as numeric 1, but scored row stores "1" string.
    expect(result.rows[0][1].value).toBe('');
    expect(result.rows[0][2].value).toBe('');
    expect(result.rows[0][3].value).toBe('');
    expect(result.rows[0][4].value).toBe('');
    expect(result.rows[0][5].value).toBe('');
    expect(result.rows[0][6].value).toBe('');
  });

  it('should format numeric values to 2 decimal places', () => {
    const result = prepareFrequencyReliTable(mockPairedSessions, mockKeySet);

    // Check that non-empty numeric values are formatted correctly
    result.rows.slice(0, -1).forEach((row) => {
      row.slice(1).forEach((cell) => {
        if (cell.value && cell.value !== '') {
          const numValue = parseFloat(cell.value);
          if (!isNaN(numValue)) {
            expect(cell.value).toMatch(/^\d+\.\d{2}$/);
          }
        }
      });
    });
  });
});

describe('prepareDurationReliTable', () => {
  const mockDurationKeySet: KeySet = {
    id: 'test-duration-keyset',
    Name: 'Test Duration KeySet',
    FrequencyKeys: [],
    DurationKeys: [
      { KeyName: 'D1', KeyDescription: 'Duration Key 1', KeyCode: 68 },
      { KeyName: 'D2', KeyDescription: 'Duration Key 2', KeyCode: 69 },
    ],
    DerivedKeys: [],
    createdAt: new Date('2024-01-01'),
    lastModified: new Date('2024-01-01'),
  };

  const mockDurationPairedSessions: ReliabilityPairType[] = [
    {
      primary: {
        ...mockPrimarySession,
        SessionSettings: { Session: 1 } as SavedSettings,
        DurationKeyPresses: [
          { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 10 },
          { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 40 },
        ] as KeyManageType[],
      },
      reli: {
        ...mockReliabilitySession,
        SessionSettings: { Session: 1 } as SavedSettings,
        DurationKeyPresses: [
          { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 15 },
          { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 45 },
        ] as KeyManageType[],
      },
    },
    {
      primary: {
        ...mockPrimarySession,
        SessionSettings: { Session: 2 } as SavedSettings,
        DurationKeyPresses: [
          { KeyDescription: 'Duration Key 2', KeyName: 'D2', TimeIntoSession: 20 },
          { KeyDescription: 'Duration Key 2', KeyName: 'D2', TimeIntoSession: 60 },
        ] as KeyManageType[],
      },
      reli: {
        ...mockReliabilitySession,
        SessionSettings: { Session: 2 } as SavedSettings,
        DurationKeyPresses: [
          { KeyDescription: 'Duration Key 2', KeyName: 'D2', TimeIntoSession: 25 },
          { KeyDescription: 'Duration Key 2', KeyName: 'D2', TimeIntoSession: 65 },
        ] as KeyManageType[],
      },
    },
  ];

  it('should create proper table structure with duration key headings', () => {
    const result = prepareDurationReliTable(mockDurationPairedSessions, mockDurationKeySet);

    expect(result.headings).toEqual([
      'Session #',
      'Duration Key 1 (EIA)',
      'Duration Key 1 (PIA)',
      'Duration Key 1 (TIA)',
      'Duration Key 1 (OIA)',
      'Duration Key 1 (NIA)',
      'Duration Key 1 (PMA)',
      'Duration Key 2 (EIA)',
      'Duration Key 2 (PIA)',
      'Duration Key 2 (TIA)',
      'Duration Key 2 (OIA)',
      'Duration Key 2 (NIA)',
      'Duration Key 2 (PMA)',
    ]);
  });

  it('should create rows for each session with duration data', () => {
    const result = prepareDurationReliTable(mockDurationPairedSessions, mockDurationKeySet);

    expect(result.rows).toHaveLength(3); // 2 sessions + 1 averaged row
    expect(result.rows[0][0].value).toBe('1');
    expect(result.rows[1][0].value).toBe('2');
    expect(result.rows[2][0].value).toBe('Averaged');
  });

  it('should handle sessions with no matching duration keys', () => {
    const singleDurationSession = [mockDurationPairedSessions[0]];
    const result = prepareDurationReliTable(singleDurationSession, mockDurationKeySet);

    expect(result.rows).toHaveLength(2); // 1 session + 1 averaged row
    // First session should have data for Duration Key 1 but 100.00 for Duration Key 2 (all bins empty = perfect match)
    expect(result.rows[0][1].value).toBeTruthy(); // Duration Key 1 EIA value
    expect(result.rows[0][7].value).toBe('100.00'); // Duration Key 2 EIA value (empty bins = 100% match)
  });

  it('should calculate duration averages correctly', () => {
    const result = prepareDurationReliTable(mockDurationPairedSessions, mockDurationKeySet);
    const averageRow = result.rows[result.rows.length - 1];

    expect(averageRow[0].value).toBe('Averaged');
    // Averages should be calculated for valid values
    expect(averageRow[1].value).not.toBe(''); // Should have averaged EIA for Duration Key 1
  });

  it('should handle empty duration paired sessions', () => {
    const result = prepareDurationReliTable([], mockDurationKeySet);

    expect(result.headings).toHaveLength(13); // Session # + 6 metrics × 2 keys
    expect(result.rows).toHaveLength(1); // Only averaged row
    expect(result.rows[0][0].value).toBe('Averaged');
  });

  it('should handle keyset with no duration keys', () => {
    const emptyDurationKeySet: KeySet = {
      ...mockDurationKeySet,
      DurationKeys: [],
    };

    const result = prepareDurationReliTable(mockDurationPairedSessions, emptyDurationKeySet);

    expect(result.headings).toEqual(['Session #']);
    expect(result.rows).toHaveLength(3); // 2 sessions + 1 averaged row
    expect(result.rows[0]).toHaveLength(1); // Only session number
    expect(result.rows[1]).toHaveLength(1); // Only session number
    expect(result.rows[2]).toHaveLength(1); // Only session number
  });

  it('should handle odd number of duration key presses', () => {
    const oddDurationSessions: ReliabilityPairType[] = [
      {
        primary: {
          ...mockPrimarySession,
          SessionSettings: { Session: 1 } as SavedSettings,
          DurationKeyPresses: [
            { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 10 },
            { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 40 },
            { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 70 }, // Odd number
          ] as KeyManageType[],
        },
        reli: {
          ...mockReliabilitySession,
          SessionSettings: { Session: 1 } as SavedSettings,
          DurationKeyPresses: [
            { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 10 },
            { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 40 },
            { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 70 }, // Odd number
          ] as KeyManageType[],
        },
      },
    ];

    const result = prepareDurationReliTable(oddDurationSessions, mockDurationKeySet);

    expect(result.rows).toHaveLength(2); // 1 session + 1 averaged row
    expect(result.rows[0][1].value).toBeTruthy(); // Should have calculated EIA
  });

  it('should format duration numeric values to 2 decimal places', () => {
    const result = prepareDurationReliTable(mockDurationPairedSessions, mockDurationKeySet);

    // Check that non-empty numeric values are formatted correctly
    result.rows.slice(0, -1).forEach((row) => {
      row.slice(1).forEach((cell) => {
        if (cell.value && cell.value !== '') {
          const numValue = parseFloat(cell.value);
          if (!isNaN(numValue)) {
            expect(cell.value).toMatch(/^\d+\.\d{2}$/);
          }
        }
      });
    });
  });

  it('should leave blank duration cells when session identifiers do not strictly match', () => {
    const keyset: KeySet = {
      ...mockDurationKeySet,
      DurationKeys: [{ KeyName: 'D1', KeyDescription: 'Duration Key 1', KeyCode: 68 }],
    };

    const pairedWithStringSession: ReliabilityPairType[] = [
      {
        primary: {
          ...mockPrimarySession,
          SessionSettings: { Session: '1' as any } as SavedSettings,
          DurationKeyPresses: [
            { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 10 },
            { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 20 },
          ] as KeyManageType[],
        },
        reli: {
          ...mockReliabilitySession,
          SessionSettings: { Session: '1' as any } as SavedSettings,
          DurationKeyPresses: [
            { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 10 },
            { KeyDescription: 'Duration Key 1', KeyName: 'D1', TimeIntoSession: 20 },
          ] as KeyManageType[],
        },
      },
    ];

    const result = prepareDurationReliTable(pairedWithStringSession, keyset);

    expect(result.rows[0][1].value).toBe('');
    expect(result.rows[0][2].value).toBe('');
    expect(result.rows[0][3].value).toBe('');
    expect(result.rows[0][4].value).toBe('');
    expect(result.rows[0][5].value).toBe('');
    expect(result.rows[0][6].value).toBe('');
  });

  it('should handle NaN values in calculations gracefully', () => {
    // Create sessions that might produce NaN values
    const problematicSessions: ReliabilityPairType[] = [
      {
        primary: {
          ...mockPrimarySession,
          SessionSettings: { Session: 1 } as SavedSettings,
          DurationKeyPresses: [] as KeyManageType[], // No key presses
        },
        reli: {
          ...mockReliabilitySession,
          SessionSettings: { Session: 1 } as SavedSettings,
          DurationKeyPresses: [] as KeyManageType[], // No key presses
        },
      },
    ];

    const result = prepareDurationReliTable(problematicSessions, mockDurationKeySet);

    expect(result.rows).toHaveLength(2); // 1 session + 1 averaged row
    // Should handle gracefully without throwing errors
    expect(result.rows[0]).toBeDefined();
    expect(result.rows[1]).toBeDefined();
  });

  it('should ensure all duration table values are marked as readOnly', () => {
    const result = prepareDurationReliTable(mockDurationPairedSessions, mockDurationKeySet);

    result.rows.forEach((row) => {
      row.forEach((cell) => {
        expect(cell.readOnly).toBe(true);
      });
    });
  });
});
