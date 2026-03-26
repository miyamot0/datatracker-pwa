import { KeySet } from '@/types/keyset';

/**
 * Unified timer type that handles all possible timer configurations
 */
export type UnifiedTimerType =
  | 'Total' // TimerMain - whole session
  | 'Timer1' // TimerOne - Primary schedule
  | 'Timer2' // TimerTwo - Secondary schedule
  | 'Timer3' // TimerThree - Tertiary schedule
  | { type: 'Special'; keyName: string }; // Special duration key timer

/**
 * Timer configuration for processing sessions
 */
export interface TimerConfig {
  timerType: UnifiedTimerType;
  includeRates?: boolean; // Calculate rates (per minute)
  includePercentages?: boolean; // Calculate percentages of total time
  includeBouts?: boolean; // Include bout information
}

export type ScoringStrategy = {
  special: boolean;
  schedule: 'system' | 'duration';
  keyset: KeySet;
  timerType: UnifiedTimerType;
  specialKeyName?: string;
};

/**
 * Processing options for session data
 */
export interface SessionProcessingOptions {
  timer: TimerConfig;
  strategy: ScoringStrategy;
  keyTypes: {
    frequency: boolean;
    duration: boolean;
    derived: boolean;
  };
  outputFormat: 'spreadsheet' | 'chart' | 'raw';
}

/**
 * Standardized processed key result format for frequency, duration, and derived keys
 */
export interface ProcessedKeyResult {
  keyName: string;
  keyDescription: string;
  keyCode: number;
  keyType: 'Frequency' | 'Duration' | 'Derived';

  // Raw values
  rawValue: number;

  // Calculated values (populated based on options)
  rate?: number; // Per minute rate
  percentage?: number; // Percentage of total time
  bouts?: number; // Number of bouts
  averageBout?: number; // Average bout length

  // Visibility
  visible: boolean; // Whether this key should be displayed
}

/**
 * Complete processed session data
 */
export interface ProcessedSessionData {
  session: number;
  condition: string;
  date: Date;
  collector: string;
  therapist: string;
  timerType: UnifiedTimerType;
  timerLabel: string;
  timerDuration: number; // in minutes

  frequencyKeys: ProcessedKeyResult[];
  durationKeys: ProcessedKeyResult[];
  derivedKeys: ProcessedKeyResult[];
}

/**
 * Chart data point interface
 */
export interface ChartDataPoint {
  session: number;
  condition: string;
  sessionTime: number;
  [key: string]: string | number; // Dynamic properties for key values
}

export type CalculationTemplate = 'FREQUENCY_RATES' | 'DURATION_PERCENTAGES' | 'SPREADSHEET_ALL' | 'CHART_ALL';
