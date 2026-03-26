import { ProcessedSessionData } from './calculation-types';

/**
 * Formats processed data for spreadsheet display
 *
 * @param data - The array of processed session data to format
 * @return A 2D array of strings representing the spreadsheet matrix, including headers and data rows
 */
export function formatForSpreadsheet(data: ProcessedSessionData[]): string[][] {
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

  console.log(data);

  //const timerEnd = sampleData.timerLabel;

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
    headers.push(`${key.keyDescription} (Derived)`);
    headers.push(`${key.keyDescription} (Derived Rate)`);
  });

  // Build data rows
  const rows = data.map((sessionData) => {
    const row = [
      sessionData.session.toString(),
      sessionData.date.toLocaleDateString(),
      sessionData.date.toLocaleTimeString(),
      sessionData.condition,
      sessionData.collector,
      sessionData.therapist,
      sessionData.timerLabel,
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

  return [headers, ...rows];
}
