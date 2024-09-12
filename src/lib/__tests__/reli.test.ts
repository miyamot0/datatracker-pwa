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
} from "../reli";
import {
  ProbedKey,
  BinValueType,
  ReliabilityPairType,
  ScoredKey,
} from "../../types/reli";
import { SavedSessionResult, SavedSettings } from "../dtos";
import { KeyManageType } from "../../components/pages/session-recorder/types/session-recorder-types";

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
  },
  SessionSettings: { Session: 1 } as SavedSettings,
  SystemKeyPresses: [],
  FrequencyKeyPresses: [{ KeyDescription: "Key1", TimeIntoSession: 30 }],
  DurationKeyPresses: [
    { KeyDescription: "Key1", TimeIntoSession: 30 },
    { KeyDescription: "Key1", TimeIntoSession: 60 },
    { KeyDescription: "Key1", TimeIntoSession: 61 },
  ],
  SessionStart: "2024-01-01T00:00:00Z",
  SessionEnd: "2024-01-01T00:30:00Z",
  EndedEarly: false,
  TimerMain: 600,
  TimerOne: 0,
  TimerTwo: 0,
  TimerThree: 0,
};

const mockReliabilitySession: SavedSessionResult = {
  ...mockPrimarySession,
  FrequencyKeyPresses: [{ KeyDescription: "Key1", TimeIntoSession: 30 }],
  DurationKeyPresses: [
    { KeyDescription: "Key1", TimeIntoSession: 30 },
    { KeyDescription: "Key1", TimeIntoSession: 60 },
    { KeyDescription: "Key1", TimeIntoSession: 61 },
  ],
};

const mockProbedKey: ProbedKey = {
  KeyName: "Key1",
  KeyDescription: "Key1 Description",
};

// Unit tests
describe("Reliability Calculations", () => {
  it("should generate an empty bin array of the specified length", () => {
    const result = generateEmptyBinArray(3);
    expect(result).toEqual([
      { BinNumber: 0, Value: 0 },
      { BinNumber: 1, Value: 0 },
      { BinNumber: 2, Value: 0 },
    ]);
  });

  it("should calculate Exact Index Agreement (EIA) correctly", () => {
    const result = generateEIABinMatch(mockPrimaryBin, mockReliabilityBin);
    expect(result).toBeCloseTo(83.33, 2);
  });

  it("should calculate Proportion Index Agreement (PIA) correctly", () => {
    const result = generatePIABinMatch(mockPrimaryBin, mockReliabilityBin);
    expect(result).toBeCloseTo(94.44, 2); // Proportion agreement with some partial matches
  });

  it("should calculate Total Interval Agreement (TIA) correctly", () => {
    const result = generateTIABinMatch(mockPrimaryBin, mockReliabilityBin);
    expect(result).toBeCloseTo(100.0, 2); // All intervals either match or are non-zero
  });

  it("should calculate Observed Interval Agreement (OIA) correctly", () => {
    const result = generateOIABinMatch(mockPrimaryBin, mockReliabilityBin);
    expect(result).toBeCloseTo(100.0, 2); // Non-empty intervals all match
  });

  it("should calculate Non-Matched Interval Agreement (NIA) correctly", () => {
    const result = generateNIABinMatch(mockPrimaryBin, mockReliabilityBin);
    expect(result).toBeCloseTo(100.0, 2); // Non-negative intervals match
  });

  it("should calculate Presence/Absence Agreement by Minute (PMA) correctly", () => {
    const result = generatePMABinMatch(mockPrimaryBin, mockReliabilityBin);
    expect(result).toBeCloseTo(83.33, 2); // Proportions by minute match
  });

  it("should add a bin to the key data", () => {
    const keyData: KeyManageType = {
      KeyDescription: "Key1",
      TimeIntoSession: 35,
    } as KeyManageType;
    const result = addBinToKeyData(keyData, 10);
    expect(result.Bin).toBe(3);
  });

  it("should get corresponding session pairs", () => {
    const result = getCorrespondingSessionPairs(
      [mockPrimarySession],
      [mockReliabilitySession]
    );
    expect(result).toEqual([
      { primary: mockPrimarySession, reli: mockReliabilitySession },
    ]);
  });

  it("should calculate reliability for frequency keys", () => {
    const pair: ReliabilityPairType = {
      primary: mockPrimarySession,
      reli: mockReliabilitySession,
    };
    const result = calculateReliabilityFrequency(
      pair,
      mockPrimarySession.FrequencyKeyPresses
    );
    expect(result.length).toBe(1);
    expect(result[0].EIA).toBeCloseTo(100.0, 2);
  });

  it("should calculate reliability for duration keys-o", () => {
    const pair: ReliabilityPairType = {
      primary: mockPrimarySession,
      reli: mockReliabilitySession,
    };
    const result = calculateReliabilityDuration(
      pair,
      mockPrimarySession.DurationKeyPresses
    );
    expect(result.length).toBe(3);
    expect(result[0].EIA).toBeCloseTo(100, 2);
  });

  it("should calculate reliability for duration keys-e", () => {
    const mockPrimarySession_trim = {
      ...mockPrimarySession,
      DurationKeyPresses: [
        { KeyDescription: "Key1", TimeIntoSession: 30 },
        { KeyDescription: "Key1", TimeIntoSession: 60 },
      ],
    };

    const mockReliabilitySession_trim = {
      ...mockReliabilitySession,
      DurationKeyPresses: [
        { KeyDescription: "Key1", TimeIntoSession: 30 },
        { KeyDescription: "Key1", TimeIntoSession: 60 },
      ],
    };

    const pair: ReliabilityPairType = {
      primary: mockPrimarySession_trim,
      reli: mockReliabilitySession_trim,
    };
    const result = calculateReliabilityDuration(
      pair,
      mockReliabilitySession.DurationKeyPresses
    );
    //console.log(result);
    //expect(result.length).toBe(2);
    expect(result[0].EIA).toBeCloseTo(100, 2);
  });
});
