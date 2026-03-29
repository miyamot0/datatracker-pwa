import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ----- Module mocks -----

vi.mock('../ui-counts-cols', () => ({
  GenerateTableCols: ({ KeyType, Keys }: { KeyType: string; Keys: any[] }) => (
    <div data-testid={`table-cols-${KeyType.toLowerCase()}`}>
      {Keys.map((k: any) => (
        <span key={k.KeyName}>{k.KeyDescription}</span>
      ))}
    </div>
  ),
}));

vi.mock('@/lib/displays', () => ({
  generateChunkedVisuals: vi.fn(() => ({
    FrequencyKeyChunks: [[{ KeyName: 'A', KeyDescription: 'Hitting', KeyCode: 65 }]],
    TablesF: 1,
    DurationKeyChunks: [],
    TablesD: 1,
  })),
}));

// ----- Import under test -----

import SessionRecorderFrequencyTallies from '../ui-counts-frequency';

// ----- Helpers -----

const makeKeyset = () =>
  ({
    FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Hitting', KeyCode: 65 }],
    DurationKeys: [],
    ScorableDurationKeys: [],
    DerivedKeys: [],
    SpecialDurationKeys: [],
  }) as any;

const makeSettings = () =>
  ({
    KeyDisplay: 'normal',
    DisplaySize: 'normal',
  }) as any;

// ----- Tests -----

describe('SessionRecorderFrequencyTallies', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SessionRecorderFrequencyTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />,
    );
    expect(container).not.toBeNull();
  });

  it('renders a Frequency table for each chunk', () => {
    render(<SessionRecorderFrequencyTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    expect(screen.getByTestId('table-cols-frequency')).not.toBeNull();
  });

  it('renders key descriptions from chunks', () => {
    render(<SessionRecorderFrequencyTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    expect(screen.getByText('Hitting')).not.toBeNull();
  });

  it('renders container with grid class', () => {
    const { container } = render(
      <SessionRecorderFrequencyTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />,
    );
    expect(container.firstChild?.['className']).toContain('grid');
  });
});
