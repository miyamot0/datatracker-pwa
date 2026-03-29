import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ----- Module mocks -----

vi.mock('../padded-row', () => ({
  PaddedRow: ({ label, value }: { label: string; value: string }) => (
    <div data-testid="padded-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  ),
}));

// ----- Import under test -----

import SessionRecorderInstructions from '../ui-instructions';

// ----- Helpers -----

const makeSettings = (overrides = {}) =>
  ({
    Condition: 'Baseline',
    Initials: 'JD',
    Therapist: 'Dr. Smith',
    KeySet: 'TestSet',
    Role: 'Primary',
    Session: 1,
    DurationS: 600,
    TimerOption: 'End on Timer #1',
    ...overrides,
  }) as any;

const makeAppSettings = (overrides = {}) =>
  ({
    TimerTwoDisplay: 'hide',
    TimerThreeDisplay: 'hide',
    ...overrides,
  }) as any;

// ----- Tests -----

describe('SessionRecorderInstructions', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SessionRecorderInstructions
        Evaluation="Eval1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    expect(container).not.toBeNull();
  });

  it('renders the Session Parameters heading', () => {
    render(
      <SessionRecorderInstructions
        Evaluation="Eval1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    expect(screen.getByText('Session Parameters')).not.toBeNull();
  });

  it('renders the Instructions heading', () => {
    render(
      <SessionRecorderInstructions
        Evaluation="EvalA"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    expect(screen.getByText('Instructions')).not.toBeNull();
  });

  it('renders Evaluation Name padded row', () => {
    render(
      <SessionRecorderInstructions
        Evaluation="TestEval"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    expect(screen.getByText('Evaluation Name:')).not.toBeNull();
    expect(screen.getByText('TestEval')).not.toBeNull();
  });

  it('renders Condition Name padded row', () => {
    render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings({ Condition: 'Reversal' })}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    expect(screen.getByText('Condition Name:')).not.toBeNull();
    expect(screen.getByText('Reversal')).not.toBeNull();
  });

  it('renders standard keyboard instruction rows', () => {
    render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    expect(screen.getByText('Enter:')).not.toBeNull();
    expect(screen.getByText('Escape:')).not.toBeNull();
  });

  it('does not render Timer #2 row when TimerTwoDisplay is hide', () => {
    render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings({ TimerTwoDisplay: 'hide' })}
      />,
    );
    expect(screen.queryByText('X:')).toBeNull();
  });

  it('renders Timer #2 row when TimerTwoDisplay is show', () => {
    render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings({ TimerTwoDisplay: 'show' })}
      />,
    );
    expect(screen.getByText('X:')).not.toBeNull();
  });

  it('renders Timer #3 row when TimerThreeDisplay is show', () => {
    render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings({ TimerThreeDisplay: 'show' })}
      />,
    );
    expect(screen.getByText('C:')).not.toBeNull();
  });

  it('renders a row for each special key', () => {
    const specialKeys = [
      { KeyName: 'F', KeyDescription: 'Schedule A', KeyCode: 70 },
      { KeyName: 'G', KeyDescription: 'Schedule B', KeyCode: 71 },
    ] as any[];
    render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={specialKeys}
        AppSettings={makeAppSettings()}
      />,
    );
    expect(screen.getByText('F:')).not.toBeNull();
    expect(screen.getByText('G:')).not.toBeNull();
  });
});
