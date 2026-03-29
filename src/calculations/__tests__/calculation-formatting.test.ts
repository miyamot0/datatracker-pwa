import { describe, it, expect } from 'vitest';
import { formatForSpreadsheet } from '../calculation-formatting';
import type { ProcessedSessionData, ProcessedKeyResult } from '../../types/calculation';

// ── Factories ────────────────────────────────────────────────────────────────

function makeFreqKey(overrides: Partial<ProcessedKeyResult> = {}): ProcessedKeyResult {
  return {
    keyName: 'FreqKey',
    keyDescription: 'Frequency Key',
    keyCode: 1,
    keyType: 'Frequency',
    rawValue: 5,
    visible: true,
    rate: 2.5,
    ...overrides,
  };
}

function makeDurKey(overrides: Partial<ProcessedKeyResult> = {}): ProcessedKeyResult {
  return {
    keyName: 'DurKey',
    keyDescription: 'Duration Key',
    keyCode: 2,
    keyType: 'Duration',
    rawValue: 60,
    visible: true,
    percentage: 25,
    bouts: 4,
    averageBout: 15,
    ...overrides,
  };
}

function makeDerivedKey(overrides: Partial<ProcessedKeyResult> = {}): ProcessedKeyResult {
  return {
    keyName: 'DerKey',
    keyDescription: 'Derived Key',
    keyCode: -999,
    keyType: 'Derived',
    rawValue: 3,
    visible: true,
    rate: 0.3,
    ...overrides,
  };
}

function makeSessionData(overrides: Partial<ProcessedSessionData> = {}): ProcessedSessionData {
  return {
    session: 1,
    condition: 'Baseline',
    date: new Date('2024-01-15T10:30:00'),
    collector: 'JD',
    therapist: 'Dr. Smith',
    timerType: 'Total',
    timerLabel: 'Session',
    timerDuration: 10,
    frequencyKeys: [],
    durationKeys: [],
    derivedKeys: [],
    ...overrides,
  };
}

// ── Base headers ─────────────────────────────────────────────────────────────

const BASE_HEADERS = [
  'Session #',
  'Date',
  'Time',
  'Condition',
  'Data Collector',
  'Therapist',
  'Timer',
  'Duration (min)',
];

// ── Tests ────────────────────────────────────────────────────────────────────

describe('formatForSpreadsheet', () => {
  // ── Empty input ────────────────────────────────────────────────────────────

  it('returns empty array for empty input', () => {
    expect(formatForSpreadsheet([])).toEqual([]);
  });

  // ── Headers ────────────────────────────────────────────────────────────────

  it('first row contains base headers when no key columns exist', () => {
    const data = [makeSessionData()];
    const result = formatForSpreadsheet(data);
    expect(result[0]).toEqual(BASE_HEADERS);
  });

  it('appends frequency column headers after base headers', () => {
    const data = [makeSessionData({ frequencyKeys: [makeFreqKey({ keyDescription: 'Target Behavior' })] })];
    const headers = formatForSpreadsheet(data)[0];
    expect(headers).toContain('Target Behavior (Count)');
    expect(headers).toContain('Target Behavior (Rate)');
  });

  it('appends duration column headers in correct order', () => {
    const data = [makeSessionData({ durationKeys: [makeDurKey({ keyDescription: 'Engagement' })] })];
    const headers = formatForSpreadsheet(data)[0];
    expect(headers).toContain('Engagement (Seconds)');
    expect(headers).toContain('Engagement (Percentage)');
    expect(headers).toContain('Engagement (Bouts)');
    expect(headers).toContain('Engagement (Avg Bout)');
  });

  it('appends derived column headers after duration columns', () => {
    const data = [makeSessionData({ derivedKeys: [makeDerivedKey({ keyDescription: 'Computed Rate' })] })];
    const headers = formatForSpreadsheet(data)[0];
    expect(headers).toContain('Computed Rate (Derived Count)');
    expect(headers).toContain('Computed Rate (Derived Rate)');
  });

  it('builds headers in order: base → frequency → duration → derived', () => {
    const data = [
      makeSessionData({
        frequencyKeys: [makeFreqKey({ keyDescription: 'FreqA' })],
        durationKeys: [makeDurKey({ keyDescription: 'DurA' })],
        derivedKeys: [makeDerivedKey({ keyDescription: 'DerA' })],
      }),
    ];
    const headers = formatForSpreadsheet(data)[0];

    const baseEnd = BASE_HEADERS.length - 1;
    const freqCountIdx = headers.indexOf('FreqA (Count)');
    const durSecondsIdx = headers.indexOf('DurA (Seconds)');
    const derivedIdx = headers.indexOf('DerA (Derived Count)');

    expect(freqCountIdx).toBeGreaterThan(baseEnd);
    expect(durSecondsIdx).toBeGreaterThan(freqCountIdx);
    expect(derivedIdx).toBeGreaterThan(durSecondsIdx);
  });

  // ── Data rows ──────────────────────────────────────────────────────────────

  it('returns header row + one data row for a single session', () => {
    const data = [makeSessionData({ session: 1 })];
    const result = formatForSpreadsheet(data);
    expect(result).toHaveLength(2); // header + 1 row
  });

  it('data row starts with session number as string', () => {
    const data = [makeSessionData({ session: 3 })];
    const rows = formatForSpreadsheet(data);
    expect(rows[1][0]).toBe('3');
  });

  it('data row includes condition, collector, and therapist', () => {
    const data = [makeSessionData({ condition: 'Treatment', collector: 'AB', therapist: 'Dr. Jones' })];
    const row = formatForSpreadsheet(data)[1];
    expect(row[3]).toBe('Treatment');
    expect(row[4]).toBe('AB');
    expect(row[5]).toBe('Dr. Jones');
  });

  it('data row includes timerLabel and timerDuration formatted to 2 decimal places', () => {
    const data = [makeSessionData({ timerLabel: 'Session', timerDuration: 10.5 })];
    const row = formatForSpreadsheet(data)[1];
    expect(row[6]).toBe('Session');
    expect(row[7]).toBe('10.50');
  });

  it('data row includes date as locale date string and time as locale time string', () => {
    const date = new Date('2024-06-01T14:00:00');
    const data = [makeSessionData({ date })];
    const row = formatForSpreadsheet(data)[1];
    expect(row[1]).toBe(date.toLocaleDateString());
    expect(row[2]).toBe(date.toLocaleTimeString());
  });

  // ── Frequency key data ─────────────────────────────────────────────────────

  it('includes frequency rawValue (count) and rate in the data row', () => {
    const data = [makeSessionData({ frequencyKeys: [makeFreqKey({ rawValue: 8, rate: 4 })] })];
    const row = formatForSpreadsheet(data)[1];
    const countIdx = formatForSpreadsheet(data)[0].indexOf('Frequency Key (Count)');
    expect(row[countIdx]).toBe('8');
    expect(row[countIdx + 1]).toBe('4.00');
  });

  it('outputs "NaN" string for frequency rate when rate is undefined', () => {
    const data = [makeSessionData({ frequencyKeys: [makeFreqKey({ rawValue: 3, rate: undefined })] })];
    const headers = formatForSpreadsheet(data)[0];
    const row = formatForSpreadsheet(data)[1];
    const rateIdx = headers.indexOf('Frequency Key (Rate)');
    expect(row[rateIdx]).toBe(NaN.toString());
  });

  // ── Duration key data ──────────────────────────────────────────────────────

  it('includes duration seconds, percentage, bouts, and averageBout in data row', () => {
    const data = [
      makeSessionData({
        durationKeys: [makeDurKey({ rawValue: 90, percentage: 30, bouts: 6, averageBout: 15 })],
      }),
    ];
    const headers = formatForSpreadsheet(data)[0];
    const row = formatForSpreadsheet(data)[1];
    const secondsIdx = headers.indexOf('Duration Key (Seconds)');

    expect(row[secondsIdx]).toBe('90.00');
    expect(row[secondsIdx + 1]).toBe('30.00');
    expect(row[secondsIdx + 2]).toBe('6');
    expect(row[secondsIdx + 3]).toBe('15.00');
  });

  it('outputs "NaN" strings for optional duration fields when undefined', () => {
    const data = [
      makeSessionData({
        durationKeys: [makeDurKey({ rawValue: 0, percentage: undefined, bouts: undefined, averageBout: undefined })],
      }),
    ];
    const headers = formatForSpreadsheet(data)[0];
    const row = formatForSpreadsheet(data)[1];
    const secondsIdx = headers.indexOf('Duration Key (Seconds)');

    expect(row[secondsIdx + 1]).toBe(NaN.toString()); // percentage
    expect(row[secondsIdx + 2]).toBe(NaN.toString()); // bouts
    expect(row[secondsIdx + 3]).toBe(NaN.toString()); // averageBout
  });

  // ── Derived key data ───────────────────────────────────────────────────────

  it('includes derived rawValue and rate in data row', () => {
    const data = [makeSessionData({ derivedKeys: [makeDerivedKey({ rawValue: 7, rate: 0.7 })] })];
    const headers = formatForSpreadsheet(data)[0];
    const row = formatForSpreadsheet(data)[1];
    const derivedIdx = headers.indexOf('Derived Key (Derived Count)');

    expect(row[derivedIdx]).toBe('7');
    expect(row[derivedIdx + 1]).toBe('0.70');
  });

  it('outputs "NaN" string for derived rate when rate is undefined', () => {
    const data = [makeSessionData({ derivedKeys: [makeDerivedKey({ rawValue: 2, rate: undefined })] })];
    const headers = formatForSpreadsheet(data)[0];
    const row = formatForSpreadsheet(data)[1];
    const rateIdx = headers.indexOf('Derived Key (Derived Rate)');
    expect(row[rateIdx]).toBe(NaN.toString());
  });

  // ── Multiple sessions ──────────────────────────────────────────────────────

  it('produces one row per session plus a header row', () => {
    const data = [makeSessionData({ session: 1 }), makeSessionData({ session: 2 }), makeSessionData({ session: 3 })];
    const result = formatForSpreadsheet(data);
    expect(result).toHaveLength(4); // header + 3 rows
  });

  it('each data row corresponds to its session in order', () => {
    const data = [
      makeSessionData({ session: 1, condition: 'Baseline' }),
      makeSessionData({ session: 2, condition: 'Treatment' }),
    ];
    const result = formatForSpreadsheet(data);
    expect(result[1][0]).toBe('1');
    expect(result[1][3]).toBe('Baseline');
    expect(result[2][0]).toBe('2');
    expect(result[2][3]).toBe('Treatment');
  });

  it('uses the first session to determine column structure', () => {
    // Multiple sessions with the same key structure should produce same headers
    const key = makeFreqKey({ keyDescription: 'FreqA' });
    const data = [
      makeSessionData({ frequencyKeys: [key], session: 1 }),
      makeSessionData({ frequencyKeys: [key], session: 2 }),
    ];
    const result = formatForSpreadsheet(data);
    expect(result[0]).toContain('FreqA (Count)');
    expect(result[0]).toContain('FreqA (Rate)');
  });

  // ── Full matrix structure ──────────────────────────────────────────────────

  it('every row has the same number of columns as the header', () => {
    const data = [
      makeSessionData({
        frequencyKeys: [makeFreqKey()],
        durationKeys: [makeDurKey()],
        derivedKeys: [makeDerivedKey()],
        session: 1,
      }),
      makeSessionData({
        frequencyKeys: [makeFreqKey()],
        durationKeys: [makeDurKey()],
        derivedKeys: [makeDerivedKey()],
        session: 2,
      }),
    ];
    const result = formatForSpreadsheet(data);
    const headerLength = result[0].length;
    for (const row of result.slice(1)) {
      expect(row).toHaveLength(headerLength);
    }
  });
});
