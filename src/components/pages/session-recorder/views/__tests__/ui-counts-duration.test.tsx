// @ts-nocheck

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
    DurationKeyChunks: [[{ KeyName: 'C', KeyDescription: 'Crying', KeyCode: 67 }]],
    TablesD: 1,
    FrequencyKeyChunks: [],
    TablesF: 1,
  })),
}));

// ----- Import under test -----

import SessionRecorderDurationTallies from '../ui-counts-duration';

// ----- Helpers -----

const makeKeyset = (overrides = {}) =>
  ({
    FrequencyKeys: [],
    DurationKeys: [{ KeyName: 'C', KeyDescription: 'Crying', KeyCode: 67 }],
    ScorableDurationKeys: [],
    DerivedKeys: [],
    SpecialDurationKeys: [],
    ...overrides,
  }) as any;

const makeSettings = () =>
  ({
    KeyDisplay: 'normal',
    DisplaySize: 'normal',
  }) as any;

// ----- Tests -----

describe('SessionRecorderDurationTallies', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <SessionRecorderDurationTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />,
    );
    expect(container).not.toBeNull();
  });

  it('renders a Duration table for each chunk', () => {
    render(<SessionRecorderDurationTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    expect(screen.getByTestId('table-cols-duration')).not.toBeNull();
  });

  it('renders key descriptions from chunks', () => {
    render(<SessionRecorderDurationTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    expect(screen.getByText('Crying')).not.toBeNull();
  });

  it('renders container with grid class', () => {
    const { container } = render(
      <SessionRecorderDurationTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />,
    );
    expect(container.firstChild?.['className']).toContain('grid');
  });
});
