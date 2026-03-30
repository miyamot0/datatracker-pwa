import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/components/ui/data-table-common', () => ({
  DataTable: ({ data }: any) => (
    <div data-testid="data-table">
      {data.map((row: any, i: number) => (
        <div key={i} data-testid="table-row">
          {row.KeyDescription}
        </div>
      ))}
    </div>
  ),
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
  });

  it('renders empty table when no PlottedKeys', async () => {
    await render(<SessionKeyList Session={makeSession([])} Settings={defaultSettings} />);
    await expect.element(page.getByTestId('data-table')).toBeInTheDocument();
    expect(page.getByTestId('table-row').elements()).toHaveLength(0);
  });
});
