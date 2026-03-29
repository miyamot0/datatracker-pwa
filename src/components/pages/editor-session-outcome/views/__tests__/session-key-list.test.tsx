import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ----- Module mocks -----

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

// ----- Import under test -----

import SessionKeyList from '../session-key-list';

// ----- Helpers -----

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

// ----- Tests -----

describe('SessionKeyList', () => {
  it('renders nothing when Session is undefined', () => {
    const { container } = render(<SessionKeyList Session={undefined} Settings={defaultSettings} />);
    expect(container.querySelector('[data-testid="data-table"]')).toBeNull();
  });

  it('renders the DataTable when session is provided', () => {
    render(<SessionKeyList Session={makeSession()} Settings={defaultSettings} />);
    expect(screen.getByTestId('data-table')).not.toBeNull();
  });

  it('renders rows for each PlottedKey', () => {
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
    render(<SessionKeyList Session={makeSession(presses)} Settings={defaultSettings} />);
    expect(screen.getAllByTestId('table-row').length).toBe(2);
  });

  it('renders empty table when no PlottedKeys', () => {
    render(<SessionKeyList Session={makeSession([])} Settings={defaultSettings} />);
    expect(screen.queryAllByTestId('table-row').length).toBe(0);
  });
});
