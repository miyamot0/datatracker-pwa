// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
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
  it('renders without crashing', async () => {
    const { container } = await render(
      <SessionRecorderFrequencyTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />,
    );
    expect(container).not.toBeNull();
  });

  it('renders a Frequency table for each chunk', async () => {
    await render(<SessionRecorderFrequencyTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    await expect.element(page.getByTestId('table-cols-frequency')).toBeInTheDocument();
  });

  it('renders key descriptions from chunks', async () => {
    await render(<SessionRecorderFrequencyTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    await expect.element(page.getByText('Hitting')).toBeInTheDocument();
  });

  it('renders container with grid class', async () => {
    await render(<SessionRecorderFrequencyTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    await expect.element(page.getByTestId('table-cols-frequency')).toBeInTheDocument();
    expect(document.querySelector('.grid')).not.toBeNull();
  });
});

