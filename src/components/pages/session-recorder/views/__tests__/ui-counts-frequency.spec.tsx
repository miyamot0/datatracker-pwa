// @ts-nocheck

import React from 'react';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Module mocks -----

vi.mock('../ui-counts-cols', () => ({
  GenerateTableCols: ({ KeyType, Keys, IsSecondary }: { KeyType: string; Keys: any[]; IsSecondary?: boolean }) => (
    <div data-testid={`table-cols-${KeyType.toLowerCase()}`} data-secondary={String(!!IsSecondary)}>
      {Keys.map((k: any) => (
        <span key={k.KeyName}>{k.KeyDescription}</span>
      ))}
    </div>
  ),
}));

const mockGenerateChunkedVisuals = vi.hoisted(() =>
  vi.fn(() => ({
    FrequencyKeyChunks: [[{ KeyName: 'A', KeyDescription: 'Hitting', KeyCode: 65 }]],
    TablesF: 1,
    DurationKeyChunks: [],
    TablesD: 1,
  })),
);

vi.mock('@/lib/displays', () => ({
  generateChunkedVisuals: mockGenerateChunkedVisuals,
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

const makeSettings = (overrides = {}) =>
  ({
    KeyDisplay: 'normal',
    DisplaySize: 'normal',
    ...overrides,
  }) as any;

// ----- Tests -----

describe('SessionRecorderFrequencyTallies', () => {
  beforeEach(() => {
    mockGenerateChunkedVisuals.mockReturnValue({
      FrequencyKeyChunks: [[{ KeyName: 'A', KeyDescription: 'Hitting', KeyCode: 65 }]],
      TablesF: 1,
      DurationKeyChunks: [],
      TablesD: 1,
    });
  });

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

  it('calls generateChunkedVisuals with isDense=true when KeyDisplay is dense', async () => {
    await render(
      <SessionRecorderFrequencyTallies
        Keyset={makeKeyset()}
        KeysPressed={[]}
        Settings={makeSettings({ KeyDisplay: 'dense' })}
      />,
    );
    expect(mockGenerateChunkedVisuals).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      true,
      expect.anything(),
    );
  });

  it('calls generateChunkedVisuals with isDense=false when KeyDisplay is normal', async () => {
    await render(
      <SessionRecorderFrequencyTallies
        Keyset={makeKeyset()}
        KeysPressed={[]}
        Settings={makeSettings({ KeyDisplay: 'normal' })}
      />,
    );
    expect(mockGenerateChunkedVisuals).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.anything(),
      false,
      expect.anything(),
    );
  });

  it('renders multiple chunks when TablesF is 2', async () => {
    mockGenerateChunkedVisuals.mockReturnValueOnce({
      FrequencyKeyChunks: [
        [{ KeyName: 'A', KeyDescription: 'Hitting', KeyCode: 65 }],
        [{ KeyName: 'B', KeyDescription: 'Kicking', KeyCode: 66 }],
      ],
      TablesF: 2,
      DurationKeyChunks: [],
      TablesD: 1,
    });

    await render(<SessionRecorderFrequencyTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    const tables = page.getByTestId('table-cols-frequency');
    expect(tables.elements().length).toBe(2);
  });

  it('sets IsSecondary=true for frequency chunks beyond the first', async () => {
    mockGenerateChunkedVisuals.mockReturnValueOnce({
      FrequencyKeyChunks: [
        [{ KeyName: 'A', KeyDescription: 'Hitting', KeyCode: 65 }],
        [{ KeyName: 'B', KeyDescription: 'Kicking', KeyCode: 66 }],
      ],
      TablesF: 2,
      DurationKeyChunks: [],
      TablesD: 1,
    });

    await render(<SessionRecorderFrequencyTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    const tables = page.getByTestId('table-cols-frequency').elements();
    expect(tables[0].getAttribute('data-secondary')).toBe('false');
    expect(tables[1].getAttribute('data-secondary')).toBe('true');
  });
});
