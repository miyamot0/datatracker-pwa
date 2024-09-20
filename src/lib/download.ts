import { HumanReadableResults } from '@/types/export';

/**
 * Export the human readable results to a CSV file
 *
 * @param results human readable results
 * @returns CSV string
 */
export function exportHumanReadableToCSV(results: HumanReadableResults) {
  const header_row = [
    'Session #',
    'Condition',
    'Data Collector',
    'Therapist',
    ...results.keys
      .map((key) => [
        `${key.Value} (Timer #1 Basis)`,
        `${key.Value} (Timer #2 Basis)`,
        `${key.Value} (Timer #3 Basis)`,
        `${key.Value} (Total)`,
      ])
      .flat(),
    'Session Duration (Minutes)',
  ];

  const data_rows = results.results.map((result) => {
    return [
      result.Session.toString().replace(/,/g, ''),
      result.Condition.toString().replace(/,/g, ''),
      result.DataCollector.toString().replace(/,/g, ''),
      result.Therapist.toString().replace(/,/g, ''),
      ...result.values.map((value) => value.Value.toString().replace(/,/g, '')),
      result.duration.toString(),
    ];
  });

  const header_string = header_row.join(',');
  const body_rows = data_rows.map((row) => row.join(','));

  const csv_string = [header_string, ...body_rows].join('\r\n');

  return csv_string;
}
