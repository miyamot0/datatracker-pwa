import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import { RateTooltip } from '../rate-elements';

// ----- Helpers -----

const makePayloadEntry = (desc: string, value: number, condition: string, sessionTime = 10, session = 1) => ({
  dataKey: desc,
  name: desc,
  value,
  payload: {
    Condition: condition,
    session,
    SessionTime: sessionTime,
  },
});

// ----- Tests -----

describe('RateTooltip', () => {
  it('renders nothing when active is false', async () => {
    await render(
      <RateTooltip active={false} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline')]} figureTextSize="base" />,
    );
    await expect.element(page.getByText(/Session #/)).not.toBeInTheDocument();
  });

  it('renders nothing when payload is empty', async () => {
    await render(<RateTooltip active={true} payload={[]} figureTextSize="base" />);
    await expect.element(page.getByText(/Session #/)).not.toBeInTheDocument();
  });

  it('renders nothing when payload is undefined', async () => {
    await render(<RateTooltip active={true} payload={undefined} figureTextSize="base" />);
    await expect.element(page.getByText(/Session #/)).not.toBeInTheDocument();
  });

  it('renders session number and condition when active', async () => {
    await render(
      <RateTooltip active={true} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline')]} figureTextSize="base" />,
    );
    await expect.element(page.getByText(/Session #1 \(Baseline\)/)).toBeInTheDocument();
  });

  it('renders session time when active', async () => {
    await render(
      <RateTooltip active={true} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline', 10)]} figureTextSize="base" />,
    );
    await expect.element(page.getByText(/Session Time: 10 min/)).toBeInTheDocument();
  });

  it('renders Count and Rate rows for the key', async () => {
    await render(
      <RateTooltip active={true} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline', 10)]} figureTextSize="base" />,
    );
    await expect.element(page.getByText(/Kicking Count/)).toBeInTheDocument();
    await expect.element(page.getByText(/Kicking Rate/)).toBeInTheDocument();
  });

  it('renders formatted rate per min', async () => {
    await render(
      <RateTooltip active={true} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline', 10)]} figureTextSize="base" />,
    );
    await expect.element(page.getByText('2.50/min')).toBeInTheDocument();
  });

  it('renders formatted total count (rate Ã— sessionTime)', async () => {
    // rate=2.5, sessionTime=10 â†’ total = 25.00
    await render(
      <RateTooltip active={true} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline', 10)]} figureTextSize="base" />,
    );
    await expect.element(page.getByText('25.00')).toBeInTheDocument();
  });

  it('filters out -Points_ entries from the payload', async () => {
    const entries = [
      makePayloadEntry('Kicking', 2.5, 'Baseline'),
      { ...makePayloadEntry('Kicking-Points_', 2.5, 'Baseline'), name: 'Kicking-Points_' },
    ];
    await render(<RateTooltip active={true} payload={entries} figureTextSize="base" />);
    await expect.element(page.getByText(/Kicking Count/).first()).toBeInTheDocument();
    expect(page.getByText(/Kicking Count/).elements().length).toBe(1);
  });

  it('applies large text size class when figureTextSize is large', async () => {
    await render(
      <RateTooltip active={true} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline')]} figureTextSize="large" />,
    );
    await expect.element(page.getByText(/Kicking Count/)).toBeInTheDocument();
    expect(document.querySelector('.text-xl')).not.toBeNull();
  });

  it('applies extra large text size class when figureTextSize is extraLarge', async () => {
    await render(
      <RateTooltip
        active={true}
        payload={[makePayloadEntry('Kicking', 2.5, 'Baseline')]}
        figureTextSize="extraLarge"
      />,
    );
    await expect.element(page.getByText(/Kicking Count/)).toBeInTheDocument();
    expect(document.querySelector('.text-2xl')).not.toBeNull();
  });
});

