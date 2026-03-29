import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import ReliabilityViewerPage from '../reli-viewer-page';
import { ReliabilityPairType } from '@/types/reli';
import { KeySet } from '@/types/keyset';
import { DEFAULT_SESSION_SETTINGS } from '@/lib/dtos';

// ----- Module mocks -----

vi.mock('../views/reli-viewer-content', () => ({
  default: ({
    Group,
    Individual,
    Paired,
    Keyset,
  }: {
    Group: string;
    Individual: string;
    Paired: ReliabilityPairType[];
    Keyset: { Name: string };
  }) => (
    <div data-testid="reli-content">
      <span data-testid="prop-group">{Group}</span>
      <span data-testid="prop-individual">{Individual}</span>
      <span data-testid="prop-paired-count">{Paired.length}</span>
      <span data-testid="prop-keyset-name">{Keyset.Name}</span>
    </div>
  ),
}));

// ----- Helpers -----

const makeKeySet = (name = 'ReliSet'): KeySet => ({
  id: 'ks-1',
  Name: name,
  FrequencyKeys: [],
  DurationKeys: [],
  DerivedKeys: [],
  SpecialDurationKeys: [],
  ScorableDurationKeys: [],
  createdAt: new Date(),
  lastModified: new Date(),
});

const makeSessionResult = () => ({
  Keyset: makeKeySet(),
  SessionSettings: DEFAULT_SESSION_SETTINGS,
  SystemKeyPresses: [],
  FrequencyKeyPresses: [],
  DurationKeyPresses: [],
  SessionStart: new Date().toISOString(),
  SessionEnd: new Date().toISOString(),
  EndedEarly: false,
  TimerMain: 600,
  TimerOne: 100,
  TimerTwo: 0,
  TimerThree: 0,
  SpecialKeyTimers: {},
});

const makePair = (): ReliabilityPairType => ({
  primary: makeSessionResult(),
  reli: makeSessionResult(),
});

// ----- Tests -----

describe('ReliabilityViewerPage', () => {
  it('renders the ReliabilityViewerContent', () => {
    render(<ReliabilityViewerPage Group="GroupA" Individual="ClientB" PairedSession={[]} Keyset={makeKeySet()} />);
    expect(screen.getByTestId('reli-content')).not.toBeNull();
  });

  it('passes Group to the content component', () => {
    render(<ReliabilityViewerPage Group="TestGroup" Individual="ClientB" PairedSession={[]} Keyset={makeKeySet()} />);
    expect(screen.getByTestId('prop-group').textContent).toBe('TestGroup');
  });

  it('passes Individual to the content component', () => {
    render(<ReliabilityViewerPage Group="GroupA" Individual="TestClient" PairedSession={[]} Keyset={makeKeySet()} />);
    expect(screen.getByTestId('prop-individual').textContent).toBe('TestClient');
  });

  it('passes PairedSession length to the content component', () => {
    const pairs = [makePair(), makePair(), makePair()];
    render(<ReliabilityViewerPage Group="GroupA" Individual="ClientB" PairedSession={pairs} Keyset={makeKeySet()} />);
    expect(screen.getByTestId('prop-paired-count').textContent).toBe('3');
  });

  it('passes empty PairedSession correctly', () => {
    render(<ReliabilityViewerPage Group="GroupA" Individual="ClientB" PairedSession={[]} Keyset={makeKeySet()} />);
    expect(screen.getByTestId('prop-paired-count').textContent).toBe('0');
  });

  it('passes Keyset.Name to the content component', () => {
    render(
      <ReliabilityViewerPage
        Group="GroupA"
        Individual="ClientB"
        PairedSession={[]}
        Keyset={makeKeySet('SpecialSet')}
      />,
    );
    expect(screen.getByTestId('prop-keyset-name').textContent).toBe('SpecialSet');
  });
});
