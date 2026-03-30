import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
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
  it('renders without crashing', async () => {
    const { container } = await render(
      <GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={1} KeyType="Frequency" />,
    );
    expect(container).not.toBeNull();
  });

  it('renders the Key header', async () => {
    await render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={1} KeyType="Frequency" />);
    await expect.element(page.getByText(/Key/)).toBeInTheDocument();
  });

  it('renders Description and Count headers', async () => {
    await render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={1} KeyType="Frequency" />);
    await expect.element(page.getByText('Description')).toBeInTheDocument();
    await expect.element(page.getByText('Count')).toBeInTheDocument();
  });

  it('renders a row for each frequency key', async () => {
    await render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={1} KeyType="Frequency" />);
    await expect.element(page.getByText('Hitting')).toBeInTheDocument();
    await expect.element(page.getByText('Kicking')).toBeInTheDocument();
  });

  it('renders key names', async () => {
    await render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={1} KeyType="Frequency" />);
    await expect.element(page.getByText('A')).toBeInTheDocument();
    await expect.element(page.getByText('B')).toBeInTheDocument();
  });

  it('renders count of 0 when no keys pressed', async () => {
    await render(
      <GenerateTableCols Keys={[makeFrequencyKeys()[0]]} KeysPressed={[]} NumCols={1} KeyType="Frequency" />,
    );
    await expect.element(page.getByRole('cell', { name: '0' })).toBeInTheDocument();
  });

  it('counts matching key presses correctly', async () => {
    const presses = [
      { KeyCode: 65, TimePressed: new Date(), KeyDescription: 'Hitting' },
      { KeyCode: 65, TimePressed: new Date(), KeyDescription: 'Hitting' },
      { KeyCode: 66, TimePressed: new Date(), KeyDescription: 'Kicking' },
    ] as any[];
    await render(
      <GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={presses} NumCols={1} KeyType="Frequency" />,
    );
    await expect.element(page.getByText('2')).toBeInTheDocument();
    await expect.element(page.getByText('1')).toBeInTheDocument();
  });

  it('shows (Frequency) label when 1 column', async () => {
    await render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={1} KeyType="Frequency" />);
    await expect.element(page.getByText('Key (Frequency)')).toBeInTheDocument();
  });

  it('shows (F) label when 2 or more columns', async () => {
    await render(<GenerateTableCols Keys={makeFrequencyKeys()} KeysPressed={[]} NumCols={2} KeyType="Frequency" />);
    await expect.element(page.getByText('Key (F)')).toBeInTheDocument();
  });
});

describe('GenerateTableCols - Duration', () => {
  it('renders without crashing with duration keys', async () => {
    const { container } = await render(
      <GenerateTableCols Keys={makeDurationKeys()} KeysPressed={[]} NumCols={1} KeyType="Duration" />,
    );
    expect(container).not.toBeNull();
  });

  it('renders duration key name', async () => {
    await render(<GenerateTableCols Keys={makeDurationKeys()} KeysPressed={[]} NumCols={1} KeyType="Duration" />);
    await expect.element(page.getByText('C').first()).toBeInTheDocument();
  });

  it('renders duration key description', async () => {
    await render(<GenerateTableCols Keys={makeDurationKeys()} KeysPressed={[]} NumCols={1} KeyType="Duration" />);
    await expect.element(page.getByText('Crying')).toBeInTheDocument();
  });

  it('shows (Duration) label when 1 column', async () => {
    await render(<GenerateTableCols Keys={makeDurationKeys()} KeysPressed={[]} NumCols={1} KeyType="Duration" />);
    await expect.element(page.getByText('Key (Duration)')).toBeInTheDocument();
  });

  it('shows (D) label when narrow', async () => {
    await render(<GenerateTableCols Keys={makeDurationKeys()} KeysPressed={[]} NumCols={2} KeyType="Duration" />);
    await expect.element(page.getByText('Key (D)')).toBeInTheDocument();
  });

  it('renders duration of 0.00 when no key presses', async () => {
    await render(<GenerateTableCols Keys={makeDurationKeys()} KeysPressed={[]} NumCols={1} KeyType="Duration" />);
    await expect.element(page.getByText('0.00')).toBeInTheDocument();
  });
});

