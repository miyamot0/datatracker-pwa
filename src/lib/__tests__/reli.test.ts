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
  calculateReliabilityFrequency,
  calculateReliabilityDuration,
  generateBinsProportion,
} from '../reli';
import { ProbedKey, BinValueType, ReliabilityPairType } from '../../types/reli';
import { SavedSessionResult, SavedSettings } from '../dtos';
import { KeyManageType } from '../../components/pages/session-recorder/types/session-recorder-types';
import { KeySet } from '@/types/keyset';

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
  FrequencyKeyPresses: [{ KeyDescription: 'Key1', TimeIntoSession: 30 }] as KeyManageType[],
  DurationKeyPresses: [
    { KeyDescription: 'Key1', TimeIntoSession: 30 },
    { KeyDescription: 'Key1', TimeIntoSession: 60 },
    { KeyDescription: 'Key1', TimeIntoSession: 61 },
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
  FrequencyKeyPresses: [{ KeyDescription: 'Key1', TimeIntoSession: 30 }] as KeyManageType[],
  DurationKeyPresses: [
    { KeyDescription: 'Key1', TimeIntoSession: 30 },
    { KeyDescription: 'Key1', TimeIntoSession: 60 },
    { KeyDescription: 'Key1', TimeIntoSession: 61 },
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
        { KeyDescription: 'Key1', TimeIntoSession: 30 },
        { KeyDescription: 'Key1', TimeIntoSession: 60 },
      ],
    };

    const mockReliabilitySession_trim = {
      ...mockReliabilitySession,
      DurationKeyPresses: [
        { KeyDescription: 'Key1', TimeIntoSession: 30 },
        { KeyDescription: 'Key1', TimeIntoSession: 60 },
      ],
    };

    const pair: ReliabilityPairType = {
      primary: mockPrimarySession_trim as SavedSessionResult,
      reli: mockReliabilitySession_trim as SavedSessionResult,
    };
    const result = calculateReliabilityDuration(pair, mockReliabilitySession.DurationKeyPresses);
    //console.log(result);
    //expect(result.length).toBe(2);
    expect(result[0].EIA).toBeCloseTo(100, 2);
  });
});

describe('generateBinsProportion', () => {
  const mockPrimarySession2: SavedSessionResult = {
    TimerMain: 120, // 120 seconds
    DurationKeyPresses: [
      { KeyDescription: 'key1', TimeIntoSession: 5 },
      { KeyDescription: 'key1', TimeIntoSession: 20 },
      { KeyDescription: 'key2', TimeIntoSession: 30 },
      { KeyDescription: 'key2', TimeIntoSession: 50 },
      { KeyDescription: 'key1', TimeIntoSession: 70 },
      { KeyDescription: 'key1', TimeIntoSession: 90 },
    ] as KeyManageType[],
  } as SavedSessionResult;

  const mockKeysToCode: ProbedKey[] = [{ KeyDescription: 'key1' }, { KeyDescription: 'key2' }] as ProbedKey[];

  it('should calculate correct proportions for even keypresses', () => {
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
        { KeyDescription: 'key1', TimeIntoSession: 5 },
        { KeyDescription: 'key1', TimeIntoSession: 20 },
        { KeyDescription: 'key1', TimeIntoSession: 70 }, // Odd number of presses for key1
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
        { KeyDescription: 'key1', TimeIntoSession: 1 },
        { KeyDescription: 'key1', TimeIntoSession: 3 },
      ] as KeyManageType[],
    };

    const result = generateBinsProportion(smallTimerSession, mockKeysToCode);

    expect(result[0].TotalBins).toBe(1); // Only one bin should be created
    expect(result[0].BinsNonzero).toBe(1); // One bin should be nonzero
    expect(result[0].Proportion).toBe(100); // Proportion should be 100%
  });
});
