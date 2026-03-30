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
    DurationKeyChunks: [[{ KeyName: 'C', KeyDescription: 'Crying', KeyCode: 67 }]],
    TablesD: 1,
    FrequencyKeyChunks: [],
    TablesF: 1,
  })),
);

vi.mock('@/lib/displays', () => ({
  generateChunkedVisuals: mockGenerateChunkedVisuals,
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

const makeSettings = (overrides = {}) =>
  ({
    KeyDisplay: 'normal',
    DisplaySize: 'normal',
    ...overrides,
  }) as any;

// ----- Tests -----

describe('SessionRecorderDurationTallies', () => {
  beforeEach(() => {
    mockGenerateChunkedVisuals.mockReturnValue({
      DurationKeyChunks: [[{ KeyName: 'C', KeyDescription: 'Crying', KeyCode: 67 }]],
      TablesD: 1,
      FrequencyKeyChunks: [],
      TablesF: 1,
    });
  });

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

  it('calls generateChunkedVisuals with isDense=true when KeyDisplay is dense', async () => {
    await render(
      <SessionRecorderDurationTallies
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
      <SessionRecorderDurationTallies
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

  it('renders multiple chunks when TablesD is 2', async () => {
    mockGenerateChunkedVisuals.mockReturnValueOnce({
      DurationKeyChunks: [
        [{ KeyName: 'C', KeyDescription: 'Crying', KeyCode: 67 }],
        [{ KeyName: 'D', KeyDescription: 'Screaming', KeyCode: 68 }],
      ],
      TablesD: 2,
      FrequencyKeyChunks: [],
      TablesF: 1,
    });

    await render(<SessionRecorderDurationTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    const tables = page.getByTestId('table-cols-duration');
    expect(tables.elements().length).toBe(2);
  });

  it('sets IsSecondary=true for chunks beyond the first', async () => {
    mockGenerateChunkedVisuals.mockReturnValueOnce({
      DurationKeyChunks: [
        [{ KeyName: 'C', KeyDescription: 'Crying', KeyCode: 67 }],
        [{ KeyName: 'D', KeyDescription: 'Screaming', KeyCode: 68 }],
      ],
      TablesD: 2,
      FrequencyKeyChunks: [],
      TablesF: 1,
    });

    await render(<SessionRecorderDurationTallies Keyset={makeKeyset()} KeysPressed={[]} Settings={makeSettings()} />);
    const tables = page.getByTestId('table-cols-duration').elements();
    expect(tables[0].getAttribute('data-secondary')).toBe('false');
    expect(tables[1].getAttribute('data-secondary')).toBe('true');
  });

  it('includes ScorableDurationKeys when calling generateChunkedVisuals', async () => {
    const keyset = makeKeyset({
      DurationKeys: [{ KeyName: 'C', KeyDescription: 'Crying', KeyCode: 67 }],
      ScorableDurationKeys: [{ KeyName: 'S', KeyDescription: 'Scored', KeyCode: 83 }],
    });

    await render(<SessionRecorderDurationTallies Keyset={keyset} KeysPressed={[]} Settings={makeSettings()} />);
    expect(mockGenerateChunkedVisuals).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.arrayContaining([expect.objectContaining({ KeyName: 'C' }), expect.objectContaining({ KeyName: 'S' })]),
      expect.anything(),
      expect.anything(),
    );
  });
});
