import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { describe, it, expect } from 'vitest';
import SessionHeaderComponent from '../header-component';

// ----- Helpers -----

const makeSettings = (overrides = {}) =>
  ({
    Role: 'Primary',
    TimerOption: 'End on Timer #1',
    DurationS: 120,
    Session: 3,
    Condition: 'Baseline',
    Initials: 'JD',
    Therapist: 'Dr. Smith',
    KeySet: 'TestSet',
    ...overrides,
  }) as any;

const makeKeyset = () =>
  ({
    SpecialDurationKeys: [],
    FrequencyKeys: [],
    DurationKeys: [],
    DerivedKeys: [],
    ScorableDurationKeys: [],
  }) as any;

// ----- Tests -----

describe('SessionHeaderComponent', () => {
  it('renders without crashing', async () => {
    const { container } = await render(
      <SessionHeaderComponent Settings={makeSettings()} RunningState="Not Started" KeySet={makeKeyset()} />,
    );
    expect(container).not.toBeNull();
  });

  it('renders the session number', async () => {
    await render(
      <SessionHeaderComponent
        Settings={makeSettings({ Session: 5 })}
        RunningState="Not Started"
        KeySet={makeKeyset()}
      />,
    );
    await expect.element(page.getByText('Session #5')).toBeInTheDocument();
  });

  it('renders Primary Data Collector role', async () => {
    await render(
      <SessionHeaderComponent
        Settings={makeSettings({ Role: 'Primary' })}
        RunningState="Not Started"
        KeySet={makeKeyset()}
      />,
    );
    await expect.element(page.getByText('Primary Data Collector')).toBeInTheDocument();
  });

  it('renders Reliability Data Collector role', async () => {
    await render(
      <SessionHeaderComponent
        Settings={makeSettings({ Role: 'Reliability' })}
        RunningState="Not Started"
        KeySet={makeKeyset()}
      />,
    );
    await expect.element(page.getByText('Reliability Data Collector')).toBeInTheDocument();
  });

  it('renders Not Started run state', async () => {
    await render(<SessionHeaderComponent Settings={makeSettings()} RunningState="Not Started" KeySet={makeKeyset()} />);
    await expect.element(page.getByText('Not Started')).toBeInTheDocument();
  });

  it('renders Started run state', async () => {
    await render(<SessionHeaderComponent Settings={makeSettings()} RunningState="Started" KeySet={makeKeyset()} />);
    await expect.element(page.getByText('Started')).toBeInTheDocument();
  });

  it('renders Completed run state', async () => {
    await render(<SessionHeaderComponent Settings={makeSettings()} RunningState="Completed" KeySet={makeKeyset()} />);
    await expect.element(page.getByText('Completed')).toBeInTheDocument();
  });

  it('renders timer string for End on Timer #1', async () => {
    await render(
      <SessionHeaderComponent
        Settings={makeSettings({ TimerOption: 'End on Timer #1', DurationS: 60 })}
        RunningState="Not Started"
        KeySet={makeKeyset()}
      />,
    );
    await expect.element(page.getByText('Timer #1 (60s)')).toBeInTheDocument();
  });

  it('renders timer string for End on Primary Timer', async () => {
    await render(
      <SessionHeaderComponent
        Settings={makeSettings({ TimerOption: 'End on Primary Timer', DurationS: 300 })}
        RunningState="Not Started"
        KeySet={makeKeyset()}
      />,
    );
    await expect.element(page.getByText('Primary Timer (300s)')).toBeInTheDocument();
  });

  it('renders No Timer Selected for unknown timer option with no matching special key', async () => {
    await render(
      <SessionHeaderComponent
        Settings={makeSettings({ TimerOption: 999 })}
        RunningState="Not Started"
        KeySet={makeKeyset()}
      />,
    );
    await expect.element(page.getByText('No Timer Selected')).toBeInTheDocument();
  });
});
