import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GenerateTableCols } from '../ui-counts-cols';

// ----- Helpers -----

const makeFrequencyKeys = () =>
  [
    { KeyName: 'A', KeyDescription: 'Hitting', KeyCode: 65 },
    { KeyName: 'B', KeyDescription: 'Kicking', KeyCode: 66 },
  ] as any[];

const makeDurationKeys = () => [{ KeyName: 'C', KeyDescription: 'Crying', KeyCode: 67 }] as any[];

// ----- Tests -----

describe('GenerateTableCols - Frequency', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={1} KeyType="Frequency" />,
    );
    expect(container).not.toBeNull();
  });

  it('renders the Key header', () => {
    render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={1} KeyType="Frequency" />);
    expect(screen.getByText(/Key/)).not.toBeNull();
  });

  it('renders Description and Count headers', () => {
    render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={1} KeyType="Frequency" />);
    expect(screen.getByText('Description')).not.toBeNull();
    expect(screen.getByText('Count')).not.toBeNull();
  });

  it('renders a row for each frequency key', () => {
    render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={1} KeyType="Frequency" />);
    expect(screen.getByText('Hitting')).not.toBeNull();
    expect(screen.getByText('Kicking')).not.toBeNull();
  });

  it('renders key names', () => {
    render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={1} KeyType="Frequency" />);
    expect(screen.getByText('A')).not.toBeNull();
    expect(screen.getByText('B')).not.toBeNull();
  });

  it('renders count of 0 when no keys pressed', () => {
    render(<GenerateTableCols Keys={[makeFrequencyKeys()[0]]} KeysPressed={[]} NumCols={1} KeyType="Frequency" />);
    const countCells = screen.getAllByText('0');
    expect(countCells.length).toBeGreaterThanOrEqual(1);
  });

  it('counts matching key presses correctly', () => {
    const presses = [
      { KeyCode: 65, TimePressed: new Date(), KeyDescription: 'Hitting' },
      { KeyCode: 65, TimePressed: new Date(), KeyDescription: 'Hitting' },
      { KeyCode: 66, TimePressed: new Date(), KeyDescription: 'Kicking' },
    ] as any[];
    render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={presses} NumCols={1} KeyType="Frequency" />);
    expect(screen.getByText('2')).not.toBeNull();
    expect(screen.getByText('1')).not.toBeNull();
  });

  it('shows (Frequency) label when 1 column', () => {
    render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={1} KeyType="Frequency" />);
    expect(screen.getByText('Key (Frequency)')).not.toBeNull();
  });

  it('shows (F) label when 2 or more columns', () => {
    render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={2} KeyType="Frequency" />);
    expect(screen.getByText('Key (F)')).not.toBeNull();
  });
});

describe('GenerateTableCols - Duration', () => {
  it('renders without crashing with duration keys', () => {
    const { container } = render(
      <GenerateTableCols Keys={makeDurationKeys()} KeysPressed={[]} NumCols={1} KeyType="Duration" />,
    );
    expect(container).not.toBeNull();
  });

  it('renders duration key name', () => {
    render(<GenerateTableCols Keys={makeDurationKeys()} KeysPressed={[]} NumCols={1} KeyType="Duration" />);
    expect(screen.getByText('C')).not.toBeNull();
  });

  it('renders duration key description', () => {
    render(<GenerateTableCols Keys={makeDurationKeys()} KeysPressed={[]} NumCols={1} KeyType="Duration" />);
    expect(screen.getByText('Crying')).not.toBeNull();
  });

  it('shows (Duration) label when 1 column', () => {
    render(<GenerateTableCols Keys={makeDurationKeys()} KeysPressed={[]} NumCols={1} KeyType="Duration" />);
    expect(screen.getByText('Key (Duration)')).not.toBeNull();
  });

  it('shows (D) label when narrow', () => {
    render(<GenerateTableCols Keys={makeDurationKeys()} KeysPressed={[]} NumCols={2} KeyType="Duration" />);
    expect(screen.getByText('Key (D)')).not.toBeNull();
  });

  it('renders duration of 0.00 when no key presses', () => {
    render(<GenerateTableCols Keys={makeDurationKeys()} KeysPressed={[]} NumCols={1} KeyType="Duration" />);
    expect(screen.getByText('0.00')).not.toBeNull();
  });
});
