import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
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
  it('renders without crashing', async () => {
    const { container } = await render(
      <SessionRecorderInstructions
        Evaluation="Eval1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    expect(container).not.toBeNull();
  });

  it('renders the Session Parameters heading', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="Eval1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    await expect.element(page.getByText('Session Parameters')).toBeInTheDocument();
  });

  it('renders the Instructions heading', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="EvalA"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    await expect.element(page.getByText('Instructions')).toBeInTheDocument();
  });

  it('renders Evaluation Name padded row', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="TestEval"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    await expect.element(page.getByText('Evaluation Name:')).toBeInTheDocument();
    await expect.element(page.getByText('TestEval')).toBeInTheDocument();
  });

  it('renders Condition Name padded row', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings({ Condition: 'Reversal' })}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    await expect.element(page.getByText('Condition Name:')).toBeInTheDocument();
    await expect.element(page.getByText('Reversal')).toBeInTheDocument();
  });

  it('renders standard keyboard instruction rows', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    await expect.element(page.getByText('Enter:')).toBeInTheDocument();
    await expect.element(page.getByText('Escape:')).toBeInTheDocument();
  });

  it('does not render Timer #2 row when TimerTwoDisplay is hide', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings({ TimerTwoDisplay: 'hide' })}
      />,
    );
    await expect.element(page.getByText('X:')).not.toBeInTheDocument();
  });

  it('renders Timer #2 row when TimerTwoDisplay is show', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings({ TimerTwoDisplay: 'show' })}
      />,
    );
    await expect.element(page.getByText('X:')).toBeInTheDocument();
  });

  it('renders Timer #3 row when TimerThreeDisplay is show', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings({ TimerThreeDisplay: 'show' })}
      />,
    );
    await expect.element(page.getByText('C:')).toBeInTheDocument();
  });

  it('renders a row for each special key', async () => {
    const specialKeys = [
      { KeyName: 'F', KeyDescription: 'Schedule A', KeyCode: 70 },
      { KeyName: 'G', KeyDescription: 'Schedule B', KeyCode: 71 },
    ] as any[];
    await render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={specialKeys}
        AppSettings={makeAppSettings()}
      />,
    );
    await expect.element(page.getByText('F:')).toBeInTheDocument();
    await expect.element(page.getByText('G:')).toBeInTheDocument();
  });

  it('renders Data Collector padded row with Initials value', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings({ Initials: 'AB' })}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    await expect.element(page.getByText('Data Collector:')).toBeInTheDocument();
    await expect.element(page.getByText('AB')).toBeInTheDocument();
  });

  it('renders Session Therapist padded row with Therapist value', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings({ Therapist: 'Dr. Jones' })}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    await expect.element(page.getByText('Session Therapist:')).toBeInTheDocument();
    await expect.element(page.getByText('Dr. Jones')).toBeInTheDocument();
  });

  it('renders Backspace instruction row', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    await expect.element(page.getByText('Backspace:')).toBeInTheDocument();
  });

  it('renders Z: instruction row for Timer #1 switch', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings()}
      />,
    );
    await expect.element(page.getByText('Z:')).toBeInTheDocument();
  });

  it('does not render Timer #3 row when TimerThreeDisplay is hide', async () => {
    await render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={[]}
        AppSettings={makeAppSettings({ TimerThreeDisplay: 'hide' })}
      />,
    );
    await expect.element(page.getByText('C:')).not.toBeInTheDocument();
  });

  it('renders Switch to value for special key in padded row', async () => {
    const specialKeys = [{ KeyName: 'F', KeyDescription: 'Schedule Alpha', KeyCode: 70 }] as any[];
    await render(
      <SessionRecorderInstructions
        Evaluation="E1"
        Settings={makeSettings()}
        KeySetSpecialKeys={specialKeys}
        AppSettings={makeAppSettings()}
      />,
    );
    await expect.element(page.getByText('Switch to Schedule Alpha')).toBeInTheDocument();
  });
});
