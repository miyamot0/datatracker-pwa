// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
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
  it('renders without crashing', async () => {
    const { container } = await render(
      <SessionRecorderDurationTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />,
    );
    expect(container).not.toBeNull();
  });

  it('renders a Duration table for each chunk', async () => {
    await render(<SessionRecorderDurationTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    await expect.element(page.getByTestId('table-cols-duration')).toBeInTheDocument();
  });

  it('renders key descriptions from chunks', async () => {
    await render(<SessionRecorderDurationTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    await expect.element(page.getByText('Crying')).toBeInTheDocument();
  });

  it('renders container with grid class', async () => {
    await render(<SessionRecorderDurationTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    await expect.element(page.getByTestId('table-cols-duration')).toBeInTheDocument();
    expect(document.querySelector('.grid')).not.toBeNull();
  });
});
