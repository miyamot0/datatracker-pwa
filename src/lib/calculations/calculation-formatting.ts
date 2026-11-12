import { ProcessedSessionData } from '../../types/calculation';

/**
 * Formats processed data for spreadsheet display
 *
 * @param data - The array of processed session data to format
 * @return A 2D array of strings representing the spreadsheet matrix, including headers and data rows
 */
export function formatForSpreadsheet(data: ProcessedSessionData[]): string[][] {
  return buildSpreadsheetMatrix(data, (value) => value);
}

/**
 * Quotes CSV fields and neutralizes spreadsheet formulas in text, not calculated numbers.
 * The protective apostrophe may be visible in CSV readers that do not interpret it as a text prefix.
 */
export function formatForCsv(data: ProcessedSessionData[]): string {
  return buildSpreadsheetMatrix(data, (value) => {
    const unsafeText = /^[\s\p{Cc}]*[=+\-@]/u.test(value) || /^[\t\r\n]/.test(value);
    return unsafeText ? `'${value}` : value;
  })
    .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(','))
    .join('\r\n');
}

function buildSpreadsheetMatrix(data: ProcessedSessionData[], formatText: (value: string) => string): string[][] {
  if (data.length === 0) return [];

  // Build header row
  const baseHeaders = [
    'Session #',
    'Date',
    'Time',
    'Condition',
    'Data Collector',
    'Therapist',
    `Timer`,
    `Duration (min)`,
  ];

  // Add dynamic headers based on processed keys (already filtered)
  const sampleData = data[0];
  const headers = [...baseHeaders];

  sampleData.frequencyKeys.forEach((key) => {
    headers.push(`${key.keyDescription} (Count)`);
    headers.push(`${key.keyDescription} (Rate)`);
  });

  sampleData.durationKeys.forEach((key) => {
    headers.push(`${key.keyDescription} (Seconds)`);
    headers.push(`${key.keyDescription} (Percentage)`);
    headers.push(`${key.keyDescription} (Bouts)`);
    headers.push(`${key.keyDescription} (Avg Bout)`);
  });

  sampleData.derivedKeys.forEach((key) => {
    headers.push(`${key.keyDescription} (Derived Count)`);
    headers.push(`${key.keyDescription} (Derived Rate)`);
  });

  // Build data rows
  const rows = data.map((sessionData) => {
    const row = [
      sessionData.session.toString(),
      formatText(sessionData.date.toLocaleDateString()),
      formatText(sessionData.date.toLocaleTimeString()),
      formatText(sessionData.condition),
      formatText(sessionData.collector),
      formatText(sessionData.therapist),
      formatText(sessionData.timerLabel),
      sessionData.timerDuration.toFixed(2),
    ];

    // Add frequency data (all keys are already visible)
    sessionData.frequencyKeys.forEach((key) => {
      row.push(key.rawValue.toString());
      row.push(key.rate?.toFixed(2) ?? NaN.toString());
    });

    // Add duration data (all keys are already visible)
    sessionData.durationKeys.forEach((key) => {
      row.push(key.rawValue.toFixed(2));
      row.push(key.percentage?.toFixed(2) ?? NaN.toString());
      row.push(key.bouts?.toString() ?? NaN.toString());
      row.push(key.averageBout?.toFixed(2) ?? NaN.toString());
    });

    // Add derived data (all keys are already visible)
    sessionData.derivedKeys.forEach((key) => {
      row.push(key.rawValue.toString());
      row.push(key.rate?.toFixed(2) ?? NaN.toString());
    });

    return row;
  });

  return [headers.map(formatText), ...rows];
}
