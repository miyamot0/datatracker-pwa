import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UnifiedTimerType,
  TimerConfig,
  SessionProcessingOptions,
  ProcessedKeyResult,
  ProcessedSessionData,
  ChartDataPoint,
  CalculationTemplate,
  processMultipleSessionData,
  convertLegacyTimerType,
  formatForSpreadsheet,
  processMultipleSessionDataWithKeys,
  PROCESSING_TEMPLATES,
} from '../calculations';
import { SavedSessionResult } from '../dtos';
import { KeySetInstance, KeySet } from '@/types/keyset';
import { LogicState } from '../logic';
import { SessionTerminationOptions } from '@/types/terminations';

// Mock dependencies
vi.mock('../schedule-parser', () => ({
  walkSessionFrequencyKey: vi.fn(),
  walkSessionDurationKey: vi.fn(),
  sumDurationSpecialKey: vi.fn(),
}));

vi.mock('../logic', () => ({
  evaluateLogic: vi.fn(),
}));

// Import mocked functions
import { walkSessionFrequencyKey, walkSessionDurationKey, sumDurationSpecialKey } from '../schedule-parser';
import { evaluateLogic } from '../logic';

// Test data factories
const createMockKeySetInstance = (overrides: Partial<KeySetInstance> = {}): KeySetInstance => ({
  KeyName: 'TestKey',
  KeyDescription: 'Test Key Description',
  KeyCode: 1,
  ...overrides,
});

const createMockKeySet = (overrides: Partial<KeySet> = {}): KeySet => ({
  id: 'test-keyset',
  Name: 'Test Keyset',
  FrequencyKeys: [
    createMockKeySetInstance({ KeyName: 'FreqKey1', KeyCode: 1 }),
    createMockKeySetInstance({ KeyName: 'FreqKey2', KeyCode: 2 }),
  ],
  DurationKeys: [
    createMockKeySetInstance({ KeyName: 'DurKey1', KeyCode: 3 }),
    createMockKeySetInstance({ KeyName: 'DurKey2', KeyCode: 4 }),
  ],
  createdAt: new Date('2024-01-01'),
  lastModified: new Date('2024-01-01'),
  DerivedKeys: [],
  SpecialDurationKeys: [
    createMockKeySetInstance({ KeyName: 'SpecialKey1', KeyCode: 5, KeyDescription: 'Special Duration Key' }),
  ],
  ...overrides,
});

const createMockLogicState = (overrides: Partial<LogicState> = {}): LogicState => ({
  id: 'logic-1',
  name: 'Derived Key 1',
  initial: { type: 'constant', value: 0 },
  fields: [{ KeyName: 'FreqKey1', KeyDescription: 'Freq Key 1', KeyCode: 1, Value: 5, Tag: 'test' }],
  steps: [
    {
      id: 'step-1',
      operation: 'add',
      operand: {
        type: 'field',
        field: { KeyName: 'FreqKey1', KeyDescription: 'Freq Key 1', KeyCode: 1, Value: 0, Tag: 'test' },
      },
    },
  ],
  value: 0,
  ...overrides,
});

const createMockSavedSessionResult = (overrides: Partial<SavedSessionResult> = {}): SavedSessionResult => ({
  Keyset: createMockKeySet(),
  SessionSettings: {
    Therapist: 'Test Therapist',
    Condition: 'Test Condition',
    KeySet: 'test-keyset',
    TimerOption: SessionTerminationOptions.Timer1,
    Initials: 'TT',
    Role: 'Primary',
    Session: 1,
    DurationS: 600,
  },
  SystemKeyPresses: [],
  FrequencyKeyPresses: [],
  DurationKeyPresses: [],
  SessionStart: '2024-01-01T10:00:00.000Z',
  SessionEnd: '2024-01-01T10:10:00.000Z',
  EndedEarly: false,
  TimerMain: 600, // 10 minutes
  TimerOne: 300, // 5 minutes
  TimerTwo: 180, // 3 minutes
  TimerThree: 120, // 2 minutes
  SpecialKeyTimers: {
    SpecialKey1: 240, // 4 minutes
  },
  ...overrides,
});

describe('Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up default mock return values
    vi.mocked(walkSessionFrequencyKey).mockReturnValue({
      KeyName: 'TestKey',
      KeyDescription: 'Test Key',
      Schedule: 'Primary',
      Value: 10,
      Bouts: -1,
    });

    vi.mocked(walkSessionDurationKey).mockReturnValue({
      KeyName: 'TestKey',
      KeyDescription: 'Test Key',
      Schedule: 'Primary',
      Value: 60.5,
      Bouts: 3,
    });

    vi.mocked(sumDurationSpecialKey).mockReturnValue(240);
    vi.mocked(evaluateLogic).mockReturnValue(15);
  });

  describe('Types and Interfaces', () => {
    it('should export correct UnifiedTimerType options', () => {
      const timerTypes: UnifiedTimerType[] = [
        'Total',
        'Timer1',
        'Timer2',
        'Timer3',
        { type: 'Special', keyName: 'SpecialKey' },
      ];

      // Test that these compile without errors
      expect(timerTypes.length).toBe(5);
    });

    it('should define ProcessedKeyResult with correct properties', () => {
      const result: ProcessedKeyResult = {
        keyName: 'test',
        keyDescription: 'Test Description',
        keyCode: 1,
        keyType: 'Frequency',
        rawValue: 10,
        rate: 2.5,
        percentage: 50,
        bouts: 3,
        averageBout: 20.5,
        visible: true,
      };

      expect(result).toBeDefined();
      expect(result.keyType).toBe('Frequency');
    });
  });

  describe('processMultipleSessionData', () => {
    it('should process multiple sessions with frequency keys only', () => {
      const mockResults = [
        createMockSavedSessionResult({
          SessionSettings: { ...createMockSavedSessionResult().SessionSettings, Session: 1 },
        }),
        createMockSavedSessionResult({
          SessionSettings: { ...createMockSavedSessionResult().SessionSettings, Session: 2 },
        }),
      ];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer1', includeRates: true },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);

      expect(result).toHaveLength(2);
      expect(result[0].session).toBe(1);
      expect(result[1].session).toBe(2);
      expect(result[0].timerType).toBe('Timer1');
      expect(result[0].timerLabel).toBe('Timer #1');
      expect(result[0].timerDuration).toBe(5); // 300 seconds / 60 = 5 minutes
    });

    it('should process sessions with duration keys and percentages', () => {
      const mockResults = [createMockSavedSessionResult()];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Total', includePercentages: true, includeBouts: true },
        keyTypes: { frequency: false, duration: true, derived: false },
        outputFormat: 'spreadsheet',
      };

      const result = processMultipleSessionData(mockResults, options);

      expect(result).toHaveLength(1);
      expect(result[0].timerType).toBe('Total');
      expect(result[0].timerLabel).toBe('Session');
      expect(result[0].timerDuration).toBe(10); // 600 seconds / 60 = 10 minutes
    });

    it('should process sessions with derived keys', () => {
      const mockKeyset = createMockKeySet({
        DerivedKeys: [createMockLogicState()],
      });
      const mockResults = [createMockSavedSessionResult({ Keyset: mockKeyset })];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer2', includeRates: true },
        keyTypes: { frequency: false, duration: false, derived: true },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);

      expect(result).toHaveLength(1);
      expect(result[0].timerType).toBe('Timer2');
      expect(result[0].timerLabel).toBe('Timer #2');
      expect(result[0].derivedKeys).toHaveLength(1);
      expect(vi.mocked(evaluateLogic)).toHaveBeenCalled();
    });

    it('should handle special timer type', () => {
      const specialTimer: UnifiedTimerType = { type: 'Special', keyName: 'SpecialKey1' };
      const mockResults = [createMockSavedSessionResult()];

      const options: SessionProcessingOptions = {
        timer: { timerType: specialTimer },
        keyTypes: { frequency: true, duration: true, derived: false },
        outputFormat: 'raw',
      };

      const result = processMultipleSessionData(mockResults, options);

      expect(result).toHaveLength(1);
      expect(result[0].timerLabel).toBe('SpecialKey1');
      expect(result[0].timerDuration).toBe(4); // 240 seconds / 60 = 4 minutes
      expect(vi.mocked(sumDurationSpecialKey)).toHaveBeenCalledWith(expect.any(Object), 'SpecialKey1');
    });

    it('should handle empty results array', () => {
      const options: SessionProcessingOptions = {
        timer: { timerType: 'Total' },
        keyTypes: { frequency: true, duration: true, derived: true },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData([], options);

      expect(result).toHaveLength(0);
    });

    it('should call frequency key processing with Total timer correctly', () => {
      const mockResults = [createMockSavedSessionResult()];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Total' },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      processMultipleSessionData(mockResults, options);

      // Should be called 3 times per key (Primary, Secondary, Tertiary)
      expect(vi.mocked(walkSessionFrequencyKey)).toHaveBeenCalledTimes(6); // 2 frequency keys * 3 schedules
    });

    it('should call duration key processing with Total timer correctly', () => {
      const mockResults = [createMockSavedSessionResult()];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Total' },
        keyTypes: { frequency: false, duration: true, derived: false },
        outputFormat: 'chart',
      };

      processMultipleSessionData(mockResults, options);

      // Should be called 3 times per key (Primary, Secondary, Tertiary)
      expect(vi.mocked(walkSessionDurationKey)).toHaveBeenCalledTimes(6); // 2 duration keys * 3 schedules
    });
  });

  describe('convertLegacyTimerType', () => {
    const mockKeyset = createMockKeySet();

    it('should convert TimerMain to Total', () => {
      const result = convertLegacyTimerType(SessionTerminationOptions.TimerMain, mockKeyset);
      expect(result).toBe('Total');
    });

    it('should convert Timer1 to Timer1', () => {
      const result = convertLegacyTimerType(SessionTerminationOptions.Timer1, mockKeyset);
      expect(result).toBe('Timer1');
    });

    it('should convert Timer2 to Timer2', () => {
      const result = convertLegacyTimerType(SessionTerminationOptions.Timer2, mockKeyset);
      expect(result).toBe('Timer2');
    });

    it('should convert Timer3 to Timer3', () => {
      const result = convertLegacyTimerType(SessionTerminationOptions.Timer3, mockKeyset);
      expect(result).toBe('Timer3');
    });

    it('should convert special duration key string to special timer type', () => {
      const specialKeyDescription = 'End on Special Duration Key';
      const result = convertLegacyTimerType(specialKeyDescription, mockKeyset);

      expect(result).toEqual({ type: 'Special', keyName: 'SpecialKey1' });
    });

    it('should default to Total for unknown legacy types', () => {
      const result = convertLegacyTimerType('Unknown Type' as any, mockKeyset);
      expect(result).toBe('Total');
    });

    it('should handle string type without matching special key', () => {
      const result = convertLegacyTimerType('No Matching Key', mockKeyset);
      expect(result).toBe('Total');
    });
  });

  describe('formatForSpreadsheet', () => {
    it('should return empty array for empty data', () => {
      const result = formatForSpreadsheet([]);
      expect(result).toEqual([]);
    });

    it('should format session data with frequency keys', () => {
      const processedData: ProcessedSessionData[] = [
        {
          session: 1,
          condition: 'Baseline',
          date: new Date('2024-01-01T10:00:00Z'),
          collector: 'AB',
          therapist: 'Dr. Smith',
          timerType: 'Timer1',
          timerLabel: 'Timer #1',
          timerDuration: 5.0,
          frequencyKeys: [
            {
              keyName: 'FreqKey1',
              keyDescription: 'Frequency Key 1',
              keyCode: 1,
              keyType: 'Frequency',
              rawValue: 10,
              rate: 2.0,
              visible: true,
            },
          ],
          durationKeys: [],
          derivedKeys: [],
        },
      ];

      const result = formatForSpreadsheet(processedData);

      expect(result).toHaveLength(2); // Header + 1 data row
      expect(result[0]).toContain('Session #');
      expect(result[0]).toContain('Frequency Key 1 (Count)');
      expect(result[0]).toContain('Frequency Key 1 (Rate)');
      expect(result[1][0]).toBe('1'); // Session number
      expect(result[1][8]).toBe('10'); // Frequency count
      expect(result[1][9]).toBe('2.00'); // Rate
    });

    it('should format session data with duration keys', () => {
      const processedData: ProcessedSessionData[] = [
        {
          session: 1,
          condition: 'Treatment',
          date: new Date('2024-01-01T10:00:00Z'),
          collector: 'CD',
          therapist: 'Dr. Jones',
          timerType: 'Total',
          timerLabel: 'Session',
          timerDuration: 10.0,
          frequencyKeys: [],
          durationKeys: [
            {
              keyName: 'DurKey1',
              keyDescription: 'Duration Key 1',
              keyCode: 2,
              keyType: 'Duration',
              rawValue: 120.5,
              percentage: 25.2,
              bouts: 3,
              averageBout: 40.17,
              visible: true,
            },
          ],
          derivedKeys: [],
        },
      ];

      const result = formatForSpreadsheet(processedData);

      expect(result[0]).toContain('Duration Key 1 (Seconds)');
      expect(result[0]).toContain('Duration Key 1 (Percentage)');
      expect(result[0]).toContain('Duration Key 1 (Bouts)');
      expect(result[0]).toContain('Duration Key 1 (Avg Bout)');
      expect(result[1][8]).toBe('120.50'); // Duration
      expect(result[1][9]).toBe('25.20'); // Percentage
      expect(result[1][10]).toBe('3'); // Bouts
      expect(result[1][11]).toBe('40.17'); // Average bout
    });

    it('should format session data with derived keys', () => {
      const processedData: ProcessedSessionData[] = [
        {
          session: 1,
          condition: 'Test',
          date: new Date('2024-01-01T10:00:00Z'),
          collector: 'EF',
          therapist: 'Dr. Brown',
          timerType: 'Timer3',
          timerLabel: 'Timer #3',
          timerDuration: 2.0,
          frequencyKeys: [],
          durationKeys: [],
          derivedKeys: [
            {
              keyName: 'DerivedKey1',
              keyDescription: 'Derived Key 1',
              keyCode: 5,
              keyType: 'Derived',
              rawValue: 15.5,
              rate: 7.75,
              visible: true,
            },
          ],
        },
      ];

      const result = formatForSpreadsheet(processedData);

      expect(result[0]).toContain('Derived Key 1 (Derived)');
      expect(result[0]).toContain('Derived Key 1 (Derived Rate)');
      expect(result[1][8]).toBe('15.5'); // Derived value
      expect(result[1][9]).toBe('7.75'); // Derived rate
    });

    it('should format complete session data with all key types', () => {
      const processedData: ProcessedSessionData[] = [
        {
          session: 1,
          condition: 'Combined',
          date: new Date('2024-01-01T10:00:00Z'),
          collector: 'GH',
          therapist: 'Dr. White',
          timerType: 'Total',
          timerLabel: 'Session',
          timerDuration: 10.0,
          frequencyKeys: [
            {
              keyName: 'FreqKey1',
              keyDescription: 'Freq 1',
              keyCode: 1,
              keyType: 'Frequency',
              rawValue: 5,
              visible: true,
            },
          ],
          durationKeys: [
            {
              keyName: 'DurKey1',
              keyDescription: 'Dur 1',
              keyCode: 2,
              keyType: 'Duration',
              rawValue: 60.0,
              visible: true,
            },
          ],
          derivedKeys: [
            {
              keyName: 'DerivedKey1',
              keyDescription: 'Derived 1',
              keyCode: 3,
              keyType: 'Derived',
              rawValue: 10,
              visible: true,
            },
          ],
        },
      ];

      const result = formatForSpreadsheet(processedData);

      expect(result[0]).toHaveLength(11); // Base headers (8) + 3 key columns
      expect(result[1]).toHaveLength(11);
      expect(result[1][8]).toBe('5'); // Frequency
      expect(result[1][9]).toBe('60.00'); // Duration
      expect(result[1][10]).toBe('10'); // Derived
    });
  });

  describe('processMultipleSessionDataWithKeys', () => {
    it('should process sessions with specific keys using default template', () => {
      const mockResults = [createMockSavedSessionResult()];
      const frequencyKeys = [createMockKeySetInstance({ KeyName: 'CustomFreqKey', KeyCode: 10 })];
      const durationKeys = [createMockKeySetInstance({ KeyName: 'CustomDurKey', KeyCode: 11 })];
      const derivedKeys = [createMockLogicState({ name: 'CustomDerived' })];

      const result = processMultipleSessionDataWithKeys(mockResults, 'Timer1', {
        frequencyKeys,
        durationKeys,
        derivedKeys,
      });

      expect(result).toHaveLength(1);
      expect(result[0].timerType).toBe('Timer1');
      // The function should override the keyset with provided keys
    });

    it('should process sessions with specific template', () => {
      const mockResults = [createMockSavedSessionResult()];
      const frequencyKeys = [createMockKeySetInstance()];
      const durationKeys = [createMockKeySetInstance()];
      const derivedKeys = [createMockLogicState()];

      const result = processMultipleSessionDataWithKeys(
        mockResults,
        'Timer2',
        { frequencyKeys, durationKeys, derivedKeys },
        'FREQUENCY_RATES',
      );

      expect(result).toHaveLength(1);
      expect(result[0].timerType).toBe('Timer2');
    });

    it('should process sessions with hidden keys', () => {
      const mockResults = [createMockSavedSessionResult()];
      const frequencyKeys = [
        createMockKeySetInstance({ KeyName: 'Visible', KeyCode: 1 }),
        createMockKeySetInstance({ KeyName: 'Hidden', KeyCode: 2 }),
      ];
      const durationKeys = [createMockKeySetInstance()];
      const derivedKeys = [createMockLogicState()];

      const hiddenKeys = {
        frequencyKeys: [createMockKeySetInstance({ KeyName: 'Hidden', KeyCode: 2 })],
        durationKeys: [],
        derivedKeys: [],
      };

      const result = processMultipleSessionDataWithKeys(
        mockResults,
        'Total',
        { frequencyKeys, durationKeys, derivedKeys },
        'CHART_ALL',
        hiddenKeys,
      );

      expect(result).toHaveLength(1);
      // Hidden key filtering is applied in the internal processing
    });
  });

  describe('PROCESSING_TEMPLATES', () => {
    it('should provide FREQUENCY_RATES template', () => {
      const template = PROCESSING_TEMPLATES.FREQUENCY_RATES('Timer1');

      expect(template.timer.timerType).toBe('Timer1');
      expect(template.timer.includeRates).toBe(true);
      expect(template.keyTypes.frequency).toBe(true);
      expect(template.keyTypes.duration).toBe(false);
      expect(template.keyTypes.derived).toBe(true);
      expect(template.outputFormat).toBe('chart');
    });

    it('should provide DURATION_PERCENTAGES template', () => {
      const template = PROCESSING_TEMPLATES.DURATION_PERCENTAGES('Timer2');

      expect(template.timer.timerType).toBe('Timer2');
      expect(template.timer.includePercentages).toBe(true);
      expect(template.timer.includeBouts).toBe(true);
      expect(template.keyTypes.frequency).toBe(false);
      expect(template.keyTypes.duration).toBe(true);
      expect(template.keyTypes.derived).toBe(false);
      expect(template.outputFormat).toBe('chart');
    });

    it('should provide SPREADSHEET_ALL template', () => {
      const template = PROCESSING_TEMPLATES.SPREADSHEET_ALL('Total');

      expect(template.timer.timerType).toBe('Total');
      expect(template.timer.includeRates).toBe(true);
      expect(template.timer.includePercentages).toBe(true);
      expect(template.timer.includeBouts).toBe(true);
      expect(template.keyTypes.frequency).toBe(true);
      expect(template.keyTypes.duration).toBe(true);
      expect(template.keyTypes.derived).toBe(true);
      expect(template.outputFormat).toBe('spreadsheet');
    });

    it('should provide CHART_ALL template', () => {
      const template = PROCESSING_TEMPLATES.CHART_ALL('Timer3');

      expect(template.timer.timerType).toBe('Timer3');
      expect(template.timer.includeRates).toBe(true);
      expect(template.timer.includePercentages).toBe(true);
      expect(template.timer.includeBouts).toBe(true);
      expect(template.keyTypes.frequency).toBe(true);
      expect(template.keyTypes.duration).toBe(true);
      expect(template.keyTypes.derived).toBe(true);
      expect(template.outputFormat).toBe('chart');
    });

    it('should work with special timer types', () => {
      const specialTimer: UnifiedTimerType = { type: 'Special', keyName: 'SpecialKey' };
      const template = PROCESSING_TEMPLATES.SPREADSHEET_ALL(specialTimer);

      expect(template.timer.timerType).toEqual(specialTimer);
      expect(template.outputFormat).toBe('spreadsheet');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle sessions with no frequency keys', () => {
      const mockKeyset = createMockKeySet({ FrequencyKeys: [] });
      const mockResults = [createMockSavedSessionResult({ Keyset: mockKeyset })];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer1' },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);

      expect(result[0].frequencyKeys).toHaveLength(0);
    });

    it('should handle sessions with no duration keys', () => {
      const mockKeyset = createMockKeySet({ DurationKeys: [] });
      const mockResults = [createMockSavedSessionResult({ Keyset: mockKeyset })];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer1' },
        keyTypes: { frequency: false, duration: true, derived: false },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);

      expect(result[0].durationKeys).toHaveLength(0);
    });

    it('should handle sessions with no derived keys', () => {
      const mockKeyset = createMockKeySet({ DerivedKeys: [] });
      const mockResults = [createMockSavedSessionResult({ Keyset: mockKeyset })];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer1' },
        keyTypes: { frequency: false, duration: false, derived: true },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);

      expect(result[0].derivedKeys).toHaveLength(0);
    });

    it('should handle zero timer duration gracefully', () => {
      const mockResults = [createMockSavedSessionResult({ TimerOne: 0 })];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer1', includeRates: true },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);

      expect(result[0].timerDuration).toBe(0);
      // Should not crash on division by zero
    });

    it('should handle missing special key timer gracefully', () => {
      vi.mocked(sumDurationSpecialKey).mockReturnValue(0);
      const specialTimer: UnifiedTimerType = { type: 'Special', keyName: 'NonExistentKey' };
      const mockResults = [createMockSavedSessionResult()];

      const options: SessionProcessingOptions = {
        timer: { timerType: specialTimer },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);

      expect(result[0].timerDuration).toBe(0);
      expect(vi.mocked(sumDurationSpecialKey)).toHaveBeenCalledWith(expect.any(Object), 'NonExistentKey');
    });
  });

  describe('Integration with Dependencies', () => {
    it('should call walkSessionFrequencyKey with correct parameters for specific timer', () => {
      const mockResults = [createMockSavedSessionResult()];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer2' },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      processMultipleSessionData(mockResults, options);

      expect(vi.mocked(walkSessionFrequencyKey)).toHaveBeenCalledWith(
        expect.any(Object),
        'Secondary', // Timer2 maps to Secondary schedule
        expect.any(Object),
        undefined, // No special key
      );
    });

    it('should call walkSessionDurationKey with correct parameters', () => {
      const mockResults = [createMockSavedSessionResult()];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer3' },
        keyTypes: { frequency: false, duration: true, derived: false },
        outputFormat: 'chart',
      };

      processMultipleSessionData(mockResults, options);

      expect(vi.mocked(walkSessionDurationKey)).toHaveBeenCalledWith(
        expect.any(Object),
        'Tertiary', // Timer3 maps to Tertiary schedule
        expect.any(Object),
      );
    });

    it('should call evaluateLogic for derived keys', () => {
      const mockKeyset = createMockKeySet({
        DerivedKeys: [createMockLogicState()],
      });
      const mockResults = [createMockSavedSessionResult({ Keyset: mockKeyset })];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer1' },
        keyTypes: { frequency: false, duration: false, derived: true },
        outputFormat: 'chart',
      };

      processMultipleSessionData(mockResults, options);

      expect(vi.mocked(evaluateLogic)).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Derived Key 1',
          fields: expect.any(Array),
        }),
      );
    });

    it('should call sumDurationSpecialKey for special timer types', () => {
      const specialTimer: UnifiedTimerType = { type: 'Special', keyName: 'TestSpecialKey' };
      const mockResults = [createMockSavedSessionResult()];

      const options: SessionProcessingOptions = {
        timer: { timerType: specialTimer },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      processMultipleSessionData(mockResults, options);

      expect(vi.mocked(sumDurationSpecialKey)).toHaveBeenCalledWith(expect.any(Object), 'TestSpecialKey');
    });
  });

  describe('Data Transformation and Calculations', () => {
    it('should calculate rates correctly for frequency keys', () => {
      vi.mocked(walkSessionFrequencyKey).mockReturnValue({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Primary',
        Value: 20, // 20 occurrences
        Bouts: -1,
      });

      const mockResults = [createMockSavedSessionResult({ TimerOne: 600 })]; // 10 minutes

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer1', includeRates: true },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);
      const freqKey = result[0].frequencyKeys[0];

      expect(freqKey.rawValue).toBe(20);
      expect(freqKey.rate).toBe(2.0); // 20 occurrences / 10 minutes = 2.0/min
    });

    it('should calculate percentages correctly for duration keys', () => {
      vi.mocked(walkSessionDurationKey).mockReturnValue({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Primary',
        Value: 300, // 300 seconds
        Bouts: 2,
      });

      const mockResults = [createMockSavedSessionResult({ TimerOne: 600 })]; // 600 seconds total

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer1', includePercentages: true, includeBouts: true },
        keyTypes: { frequency: false, duration: true, derived: false },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);
      const durKey = result[0].durationKeys[0];

      expect(durKey.rawValue).toBe(300);
      expect(durKey.percentage).toBe(50); // 300/600 * 100 = 50%
      expect(durKey.bouts).toBe(2);
      expect(durKey.averageBout).toBe(150); // 300/2 = 150 seconds per bout
    });

    it('should calculate derived key rates correctly', () => {
      vi.mocked(evaluateLogic).mockReturnValue(30);

      const mockKeyset = createMockKeySet({
        DerivedKeys: [createMockLogicState()],
      });
      const mockResults = [
        createMockSavedSessionResult({
          Keyset: mockKeyset,
          TimerTwo: 900, // 15 minutes
        }),
      ];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer2', includeRates: true },
        keyTypes: { frequency: false, duration: false, derived: true },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);
      const derivedKey = result[0].derivedKeys[0];

      expect(derivedKey.rawValue).toBe(30);
      expect(derivedKey.rate).toBe(2.0); // 30 / 15 minutes = 2.0/min
    });

    it('should handle zero bouts in duration calculations', () => {
      vi.mocked(walkSessionDurationKey).mockReturnValue({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Primary',
        Value: 100,
        Bouts: 0, // No bouts
      });

      const mockResults = [createMockSavedSessionResult()];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer1', includeBouts: true },
        keyTypes: { frequency: false, duration: true, derived: false },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);
      const durKey = result[0].durationKeys[0];

      expect(durKey.bouts).toBe(0);
      expect(durKey.averageBout).toBe(0); // Should handle division by zero
    });

    it('should not calculate rates when timerMinutes is zero', () => {
      vi.mocked(walkSessionFrequencyKey).mockReturnValue({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Primary',
        Value: 10,
        Bouts: -1,
      });

      const mockResults = [createMockSavedSessionResult({ TimerOne: 0 })]; // 0 minutes

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer1', includeRates: true },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);
      const freqKey = result[0].frequencyKeys[0];

      expect(freqKey.rawValue).toBe(10);
      expect(freqKey.rate).toBeUndefined(); // Should not calculate rate with 0 minutes
    });

    it('should not calculate percentages when timerSeconds is zero', () => {
      vi.mocked(walkSessionDurationKey).mockReturnValue({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Primary',
        Value: 100,
        Bouts: 1,
      });

      const mockResults = [createMockSavedSessionResult({ TimerOne: 0 })]; // 0 seconds

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer1', includePercentages: true },
        keyTypes: { frequency: false, duration: true, derived: false },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);
      const durKey = result[0].durationKeys[0];

      expect(durKey.rawValue).toBe(100);
      expect(durKey.percentage).toBeUndefined(); // Should not calculate percentage with 0 seconds
    });

    it('should handle missing frequency keys in derived key calculation', () => {
      vi.mocked(walkSessionFrequencyKey).mockReturnValue({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Primary',
        Value: 0,
        Bouts: -1,
      });
      vi.mocked(evaluateLogic).mockReturnValue(5);

      const mockLogicState = createMockLogicState({
        fields: [{ KeyName: 'MissingKey', KeyDescription: 'Missing Key', KeyCode: 999, Value: 0, Tag: 'test' }],
      });
      const mockKeyset = createMockKeySet({
        DerivedKeys: [mockLogicState],
      });
      const mockResults = [createMockSavedSessionResult({ Keyset: mockKeyset })];

      const options: SessionProcessingOptions = {
        timer: { timerType: 'Timer1' },
        keyTypes: { frequency: false, duration: false, derived: true },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);

      expect(result[0].derivedKeys).toHaveLength(1);
      expect(vi.mocked(evaluateLogic)).toHaveBeenCalledWith(
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              Value: NaN, // Missing key should have NaN value
            }),
          ]),
        }),
      );
    });
  });

  describe('Complex Scenarios and Full Integration', () => {
    it('should handle multiple sessions with different timer configurations', () => {
      const mockResults = [
        createMockSavedSessionResult({
          SessionSettings: { ...createMockSavedSessionResult().SessionSettings, Session: 1 },
          TimerOne: 300,
        }),
        createMockSavedSessionResult({
          SessionSettings: { ...createMockSavedSessionResult().SessionSettings, Session: 2 },
          TimerTwo: 600,
        }),
        createMockSavedSessionResult({
          SessionSettings: { ...createMockSavedSessionResult().SessionSettings, Session: 3 },
          TimerThree: 900,
        }),
      ];

      // Test different timer types for each session
      const options1: SessionProcessingOptions = {
        timer: { timerType: 'Timer1', includeRates: true },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      const result1 = processMultipleSessionData([mockResults[0]], options1);
      expect(result1[0].timerLabel).toBe('Timer #1');
      expect(result1[0].timerDuration).toBe(5); // 300s / 60 = 5 min

      const options2: SessionProcessingOptions = {
        timer: { timerType: 'Timer2', includePercentages: true },
        keyTypes: { frequency: false, duration: true, derived: false },
        outputFormat: 'chart',
      };

      const result2 = processMultipleSessionData([mockResults[1]], options2);
      expect(result2[0].timerLabel).toBe('Timer #2');
      expect(result2[0].timerDuration).toBe(10); // 600s / 60 = 10 min

      const options3: SessionProcessingOptions = {
        timer: { timerType: 'Timer3', includeBouts: true },
        keyTypes: { frequency: false, duration: true, derived: false },
        outputFormat: 'chart',
      };

      const result3 = processMultipleSessionData([mockResults[2]], options3);
      expect(result3[0].timerLabel).toBe('Timer #3');
      expect(result3[0].timerDuration).toBe(15); // 900s / 60 = 15 min
    });

    it('should handle special timer with frequency key processing', () => {
      const specialTimer: UnifiedTimerType = { type: 'Special', keyName: 'SpecialTimerKey' };
      vi.mocked(sumDurationSpecialKey).mockReturnValue(480); // 8 minutes
      vi.mocked(walkSessionFrequencyKey).mockReturnValue({
        KeyName: 'FreqKey1',
        KeyDescription: 'Frequency Key 1',
        Schedule: 'Special',
        Value: 32,
        Bouts: -1,
      });

      const mockResults = [createMockSavedSessionResult()];

      const options: SessionProcessingOptions = {
        timer: { timerType: specialTimer, includeRates: true },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      const result = processMultipleSessionData(mockResults, options);

      expect(result[0].timerLabel).toBe('SpecialTimerKey');
      expect(result[0].timerDuration).toBe(8); // 480s / 60 = 8 min
      expect(result[0].frequencyKeys[0].rawValue).toBe(32);
      expect(result[0].frequencyKeys[0].rate).toBe(4.0); // 32 / 8 min = 4.0/min

      // Verify special key is passed to walkSessionFrequencyKey
      expect(vi.mocked(walkSessionFrequencyKey)).toHaveBeenCalledWith(
        expect.any(Object),
        'Special',
        expect.any(Object),
        'SpecialTimerKey',
      );
    });

    it('should process all key types with all calculation options enabled', () => {
      vi.mocked(walkSessionFrequencyKey).mockReturnValue({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Primary',
        Value: 25,
        Bouts: -1,
      });
      vi.mocked(walkSessionDurationKey).mockReturnValue({
        KeyName: 'TestKey',
        KeyDescription: 'Test Key',
        Schedule: 'Primary',
        Value: 180,
        Bouts: 4,
      });
      vi.mocked(evaluateLogic).mockReturnValue(12.5);

      const mockKeyset = createMockKeySet({
        DerivedKeys: [createMockLogicState()],
      });
      const mockResults = [
        createMockSavedSessionResult({
          Keyset: mockKeyset,
          TimerMain: 1200, // 20 minutes
        }),
      ];

      const options: SessionProcessingOptions = {
        timer: {
          timerType: 'Total',
          includeRates: true,
          includePercentages: true,
          includeBouts: true,
        },
        keyTypes: { frequency: true, duration: true, derived: true },
        outputFormat: 'spreadsheet',
      };

      const result = processMultipleSessionData(mockResults, options);

      // Check frequency key calculations
      const freqKey = result[0].frequencyKeys[0];
      expect(freqKey.rawValue).toBe(75); // Sum of 3 schedules: 25 * 3
      expect(freqKey.rate).toBe(3.75); // 75 / 20 min = 3.75/min

      // Check duration key calculations
      const durKey = result[0].durationKeys[0];
      expect(durKey.rawValue).toBe(540); // Sum of 3 schedules: 180 * 3
      expect(durKey.percentage).toBe(45); // 540 / 1200 * 100 = 45%
      expect(durKey.bouts).toBe(4); // Max of schedule bouts
      expect(durKey.averageBout).toBe(135); // 540 / 4 = 135

      // Check derived key calculations
      const derivedKey = result[0].derivedKeys[0];
      expect(derivedKey.rawValue).toBe(12.5);
      expect(derivedKey.rate).toBe(0.625); // 12.5 / 20 min = 0.625/min
    });

    it('should format complex data for spreadsheet with all columns', () => {
      // Set up complex mock data with all features
      const processedData: ProcessedSessionData[] = [
        {
          session: 42,
          condition: 'Complex Test Condition',
          date: new Date('2024-12-25T15:30:45Z'),
          collector: 'ABC',
          therapist: 'Dr. Complex',
          timerType: 'Total',
          timerLabel: 'Session',
          timerDuration: 12.5,
          frequencyKeys: [
            {
              keyName: 'ComplexFreq',
              keyDescription: 'Complex Frequency Key',
              keyCode: 10,
              keyType: 'Frequency',
              rawValue: 45,
              rate: 3.6,
              visible: true,
            },
          ],
          durationKeys: [
            {
              keyName: 'ComplexDur',
              keyDescription: 'Complex Duration Key',
              keyCode: 20,
              keyType: 'Duration',
              rawValue: 456.78,
              percentage: 60.9,
              bouts: 7,
              averageBout: 65.25,
              visible: true,
            },
          ],
          derivedKeys: [
            {
              keyName: 'ComplexDerived',
              keyDescription: 'Complex Derived Key',
              keyCode: 30,
              keyType: 'Derived',
              rawValue: 23.456,
              rate: 1.876,
              visible: true,
            },
          ],
        },
      ];

      const result = formatForSpreadsheet(processedData);

      expect(result).toHaveLength(2); // Header + 1 data row

      // Check that all expected columns exist
      const headers = result[0];
      expect(headers).toContain('Session #');
      expect(headers).toContain('Date');
      expect(headers).toContain('Time');
      expect(headers).toContain('Condition');
      expect(headers).toContain('Data Collector');
      expect(headers).toContain('Therapist');
      expect(headers).toContain('Timer');
      expect(headers).toContain('Duration (min)');
      expect(headers).toContain('Complex Frequency Key (Count)');
      expect(headers).toContain('Complex Frequency Key (Rate)');
      expect(headers).toContain('Complex Duration Key (Seconds)');
      expect(headers).toContain('Complex Duration Key (Percentage)');
      expect(headers).toContain('Complex Duration Key (Bouts)');
      expect(headers).toContain('Complex Duration Key (Avg Bout)');
      expect(headers).toContain('Complex Derived Key (Derived)');
      expect(headers).toContain('Complex Derived Key (Derived Rate)');

      // Check data row values
      const dataRow = result[1];
      expect(dataRow[0]).toBe('42'); // Session
      expect(dataRow[3]).toBe('Complex Test Condition'); // Condition
      expect(dataRow[4]).toBe('ABC'); // Collector
      expect(dataRow[5]).toBe('Dr. Complex'); // Therapist
      expect(dataRow[6]).toBe('Session'); // Timer label
      expect(dataRow[7]).toBe('12.50'); // Duration
      expect(dataRow[8]).toBe('45'); // Frequency count
      expect(dataRow[9]).toBe('3.60'); // Frequency rate
      expect(dataRow[10]).toBe('456.78'); // Duration seconds
      expect(dataRow[11]).toBe('60.90'); // Duration percentage
      expect(dataRow[12]).toBe('7'); // Duration bouts
      expect(dataRow[13]).toBe('65.25'); // Average bout
      expect(dataRow[14]).toBe('23.456'); // Derived value
      expect(dataRow[15]).toBe('1.88'); // Derived rate
    });
  });

  describe('Timer Schedule Mapping', () => {
    it('should map timer types to correct schedules through processing', () => {
      const mockResults = [createMockSavedSessionResult()];

      // Test Timer1 -> Primary
      const options1: SessionProcessingOptions = {
        timer: { timerType: 'Timer1' },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      processMultipleSessionData(mockResults, options1);
      expect(vi.mocked(walkSessionFrequencyKey)).toHaveBeenCalledWith(
        expect.any(Object),
        'Primary',
        expect.any(Object),
        undefined,
      );

      vi.clearAllMocks();
      vi.mocked(walkSessionFrequencyKey).mockReturnValue({
        KeyName: 'TestKey',
        KeyDescription: 'Test',
        Schedule: 'Secondary',
        Value: 10,
        Bouts: -1,
      });

      // Test Timer2 -> Secondary
      const options2: SessionProcessingOptions = {
        timer: { timerType: 'Timer2' },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      processMultipleSessionData(mockResults, options2);
      expect(vi.mocked(walkSessionFrequencyKey)).toHaveBeenCalledWith(
        expect.any(Object),
        'Secondary',
        expect.any(Object),
        undefined,
      );

      vi.clearAllMocks();
      vi.mocked(walkSessionFrequencyKey).mockReturnValue({
        KeyName: 'TestKey',
        KeyDescription: 'Test',
        Schedule: 'Tertiary',
        Value: 10,
        Bouts: -1,
      });

      // Test Timer3 -> Tertiary
      const options3: SessionProcessingOptions = {
        timer: { timerType: 'Timer3' },
        keyTypes: { frequency: true, duration: false, derived: false },
        outputFormat: 'chart',
      };

      processMultipleSessionData(mockResults, options3);
      expect(vi.mocked(walkSessionFrequencyKey)).toHaveBeenCalledWith(
        expect.any(Object),
        'Tertiary',
        expect.any(Object),
        undefined,
      );
    });
  });
});
