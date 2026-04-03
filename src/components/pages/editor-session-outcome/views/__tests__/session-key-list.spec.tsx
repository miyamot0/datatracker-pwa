import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';

const mockCaptureDataTableProps = vi.hoisted(() => vi.fn());

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({ data, columns, hiddenCols, limitCols, settings }: any) => {
    mockCaptureDataTableProps({ data, columns, hiddenCols, limitCols, settings });

    return (
      <div data-testid="data-table">
        <div data-testid="column-count">{columns.length}</div>
        {columns.map((column: any, i: number) => (
          <div key={`header-${i}`} data-testid="header-cell">
            {column.header?.({ column: { id: column.id ?? column.accessorKey } })}
          </div>
        ))}
        {data.map((row: any, i: number) => (
          <div key={i} data-testid="table-row" data-time-into-session={row.TimeIntoSession?.toString() ?? ''}>
            {columns.map((column: any, c: number) => (
              <div key={`cell-${i}-${c}`} data-testid={`table-cell-${i}-${c}`}>
                {column.cell?.({ row: { original: row } })}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  },
}));

vi.mock('@/components/ui/data-table-column-header', () => ({
  DataTableColumnHeader: ({ title }: any) => <span>{title}</span>,
}));

import SessionKeyList from '../session-key-list';

const makeSession = (keyPresses: any[] = []) =>
  ({
    SessionSettings: {
      Condition: 'Baseline',
      Session: 1,
      TimerOption: 'End on Timer #1',
      Initials: 'JD',
      Role: 'Primary',
      DurationS: 600,
      KeySet: 'TestSet',
      Therapist: 'Dr. Smith',
    },
    SystemKeyPresses: [],
    FrequencyKeyPresses: [],
    DurationKeyPresses: [],
    PlottedKeys: keyPresses,
    SessionStart: new Date().toISOString(),
    SessionEnd: new Date().toISOString(),
    EndedEarly: false,
    TimerMain: 60,
    TimerOne: 60,
    TimerTwo: 0,
    TimerThree: 0,
    Filename: 'test.json',
    MaxY: 5,
    Keyset: {
      id: 'ks1',
      Name: 'TestSet',
      FrequencyKeys: [],
      DurationKeys: [],
      DerivedKeys: [],
      SpecialDurationKeys: [],
      ScorableDurationKeys: [],
      createdAt: new Date(),
    },
    Comments: '',
  }) as any;

const defaultSettings = {
  NotificationSettings: 'All',
  EnableToolTip: true,
} as any;

describe('SessionKeyList', () => {
  it('passes table behavior props and all seven columns to DataTable', async () => {
    await render(<SessionKeyList Session={makeSession()} Settings={defaultSettings} />);

    const call = mockCaptureDataTableProps.mock.calls.at(-1)?.[0];
    expect(call).toBeDefined();
    expect(call.limitCols).toBe(true);
    expect(call.hiddenCols).toEqual({ 'Time Into Session (min)': true });
    expect(call.settings).toEqual(defaultSettings);
    await expect.element(page.getByTestId('column-count')).toHaveTextContent('7');
  });

  it('renders nothing when Session is undefined', async () => {
    await render(<SessionKeyList Session={undefined} Settings={defaultSettings} />);
    await expect.element(page.getByTestId('data-table')).not.toBeInTheDocument();
  });

  it('renders the DataTable when session is provided', async () => {
    await render(<SessionKeyList Session={makeSession()} Settings={defaultSettings} />);
    await expect.element(page.getByTestId('data-table')).toBeInTheDocument();
  });

  it('renders rows for each PlottedKey', async () => {
    const presses = [
      {
        KeyDescription: 'Hitting',
        KeyName: 'a',
        KeyCode: 65,
        TimeIntoSession: 1.5,
        TimePressed: Date.now(),
        KeyScheduleRecording: 'Primary',
        KeyType: 'Frequency',
      },
      {
        KeyDescription: 'Kicking',
        KeyName: 'b',
        KeyCode: 66,
        TimeIntoSession: 3.0,
        TimePressed: Date.now(),
        KeyScheduleRecording: 'Primary',
        KeyType: 'Frequency',
      },
    ];
    await render(<SessionKeyList Session={makeSession(presses)} Settings={defaultSettings} />);
    await expect.element(page.getByTestId('table-row').first()).toBeInTheDocument();
    const rows = await page.getByTestId('table-row').all();
    expect(rows).toHaveLength(2);

    await expect.element(page.getByText('Recorded Event')).toBeInTheDocument();
    await expect.element(page.getByText('Key Pressed')).toBeInTheDocument();
    await expect.element(page.getByText('Timer/Schedule')).toBeInTheDocument();
    await expect.element(page.getByText('Key Information')).toBeInTheDocument();
    await expect.element(page.getByText('Time Pressed')).toBeInTheDocument();
    await expect.element(page.getByText('Time Into Session (sec)')).toBeInTheDocument();
    await expect.element(page.getByText('Time Into Session (min)')).toBeInTheDocument();

    await expect.element(page.getByText('1.500')).toBeInTheDocument();
    await expect.element(page.getByText('0.025 min')).toBeInTheDocument();
  });

  it('sorts plotted keys by TimeIntoSession ascending before render', async () => {
    const presses = [
      {
        KeyDescription: 'Late Key',
        KeyName: 'z',
        KeyCode: 90,
        TimeIntoSession: 9.5,
        TimePressed: Date.now(),
        KeyScheduleRecording: 'Primary',
        KeyType: 'Frequency',
      },
      {
        KeyDescription: 'Early Key',
        KeyName: 'a',
        KeyCode: 65,
        TimeIntoSession: 1.25,
        TimePressed: Date.now(),
        KeyScheduleRecording: 'Secondary',
        KeyType: 'Duration',
      },
    ];

    await render(<SessionKeyList Session={makeSession(presses)} Settings={defaultSettings} />);

    const rows = await page.getByTestId('table-row').all();
    await expect.element(rows[0]).toHaveAttribute('data-time-into-session', '1.25');
    await expect.element(rows[1]).toHaveAttribute('data-time-into-session', '9.5');
  });

  it('renders empty table when no PlottedKeys', async () => {
    await render(<SessionKeyList Session={makeSession([])} Settings={defaultSettings} />);
    await expect.element(page.getByTestId('data-table')).toBeInTheDocument();
    expect(page.getByTestId('table-row').elements()).toHaveLength(0);
  });
});
