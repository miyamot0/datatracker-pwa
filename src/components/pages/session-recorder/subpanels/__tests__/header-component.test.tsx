import React from 'react';
import { render, screen } from '@testing-library/react';
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
  it('renders without crashing', () => {
    const { container } = render(
      <SessionHeaderComponent Settings={makeSettings()} RunningState="Not Started" KeySet={makeKeyset()} />,
    );
    expect(container).not.toBeNull();
  });

  it('renders the session number', () => {
    render(
      <SessionHeaderComponent
        Settings={makeSettings({ Session: 5 })}
        RunningState="Not Started"
        KeySet={makeKeyset()}
      />,
    );
    expect(screen.getByText('Session #5')).not.toBeNull();
  });

  it('renders Primary Data Collector role', () => {
    render(
      <SessionHeaderComponent
        Settings={makeSettings({ Role: 'Primary' })}
        RunningState="Not Started"
        KeySet={makeKeyset()}
      />,
    );
    expect(screen.getByText('Primary Data Collector')).not.toBeNull();
  });

  it('renders Reliability Data Collector role', () => {
    render(
      <SessionHeaderComponent
        Settings={makeSettings({ Role: 'Reliability' })}
        RunningState="Not Started"
        KeySet={makeKeyset()}
      />,
    );
    expect(screen.getByText('Reliability Data Collector')).not.toBeNull();
  });

  it('renders Not Started run state', () => {
    render(<SessionHeaderComponent Settings={makeSettings()} RunningState="Not Started" KeySet={makeKeyset()} />);
    expect(screen.getByText('Not Started')).not.toBeNull();
  });

  it('renders Started run state', () => {
    render(<SessionHeaderComponent Settings={makeSettings()} RunningState="Started" KeySet={makeKeyset()} />);
    expect(screen.getByText('Started')).not.toBeNull();
  });

  it('renders Completed run state', () => {
    render(<SessionHeaderComponent Settings={makeSettings()} RunningState="Completed" KeySet={makeKeyset()} />);
    expect(screen.getByText('Completed')).not.toBeNull();
  });

  it('renders timer string for End on Timer #1', () => {
    render(
      <SessionHeaderComponent
        Settings={makeSettings({ TimerOption: 'End on Timer #1', DurationS: 60 })}
        RunningState="Not Started"
        KeySet={makeKeyset()}
      />,
    );
    expect(screen.getByText('Timer #1 (60s)')).not.toBeNull();
  });

  it('renders timer string for End on Primary Timer', () => {
    render(
      <SessionHeaderComponent
        Settings={makeSettings({ TimerOption: 'End on Primary Timer', DurationS: 300 })}
        RunningState="Not Started"
        KeySet={makeKeyset()}
      />,
    );
    expect(screen.getByText('Primary Timer (300s)')).not.toBeNull();
  });

  it('renders No Timer Selected for unknown timer option with no matching special key', () => {
    render(
      <SessionHeaderComponent
        Settings={makeSettings({ TimerOption: 999 })}
        RunningState="Not Started"
        KeySet={makeKeyset()}
      />,
    );
    expect(screen.getByText('No Timer Selected')).not.toBeNull();
  });
});
