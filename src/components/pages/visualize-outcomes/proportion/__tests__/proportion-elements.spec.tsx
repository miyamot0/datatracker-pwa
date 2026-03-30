import { render } from 'vitest-browser-react';
import { page } from '@vitest/browser/context';
import { describe, it, expect } from 'vitest';
import { ProportionTooltip } from '../proportion-elements';

// ----- Helpers -----

const makePayloadEntry = (desc: string, value: number, condition: string, sessionTime = 10, session = 1) => ({
  dataKey: desc,
  name: desc,
  value,
  payload: {
    Condition: condition,
    session,
    SessionTime: sessionTime,
    [`${desc}-Bouts`]: 3,
    [`${desc}-Bout-Ave`]: 4.5,
  },
});

// ----- Tests -----

describe('ProportionTooltip', () => {
  it('renders nothing when active is false', async () => {
    await render(
      <ProportionTooltip
        active={false}
        payload={[makePayloadEntry('Kicking', 50, 'Baseline')]}
        figureTextSize="base"
      />,
    );
    await expect.element(page.getByText(/Session #/)).not.toBeInTheDocument();
  });

  it('renders nothing when payload is empty', async () => {
    await render(<ProportionTooltip active={true} payload={[]} figureTextSize="base" />);
    await expect.element(page.getByText(/Session #/)).not.toBeInTheDocument();
  });

  it('renders nothing when payload is undefined', async () => {
    await render(<ProportionTooltip active={true} payload={undefined} figureTextSize="base" />);
    await expect.element(page.getByText(/Session #/)).not.toBeInTheDocument();
  });

  it('renders session number and condition when active', async () => {
    await render(
      <ProportionTooltip active={true} payload={[makePayloadEntry('Kicking', 50, 'Baseline')]} figureTextSize="base" />,
    );
    await expect.element(page.getByText(/Session #1 \(Baseline\)/)).toBeInTheDocument();
  });

  it('renders session time when active', async () => {
    await render(
      <ProportionTooltip
        active={true}
        payload={[makePayloadEntry('Kicking', 50, 'Baseline', 10)]}
        figureTextSize="base"
      />,
    );
    await expect.element(page.getByText(/Session Time: 10 min/)).toBeInTheDocument();
  });

  it('renders Total and % rows for the key', async () => {
    await render(
      <ProportionTooltip
        active={true}
        payload={[makePayloadEntry('Kicking', 50, 'Baseline', 10)]}
        figureTextSize="base"
      />,
    );
    await expect.element(page.getByText(/Kicking Total/)).toBeInTheDocument();
    await expect.element(page.getByText(/Kicking %/)).toBeInTheDocument();
  });

  it('renders Bouts count row when payload has bout data', async () => {
    await render(
      <ProportionTooltip active={true} payload={[makePayloadEntry('Kicking', 50, 'Baseline')]} figureTextSize="base" />,
    );
    await expect.element(page.getByText(/Kicking Bouts/)).toBeInTheDocument();
    await expect.element(page.getByText('3', { exact: true }).first()).toBeInTheDocument();
  });

  it('renders Ave row with formatted value', async () => {
    await render(
      <ProportionTooltip active={true} payload={[makePayloadEntry('Kicking', 50, 'Baseline')]} figureTextSize="base" />,
    );
    await expect.element(page.getByText(/Kicking Ave/)).toBeInTheDocument();
    await expect.element(page.getByText('4.50s')).toBeInTheDocument();
  });

  it('filters out -Points_ entries from the payload', async () => {
    const entries = [
      makePayloadEntry('Kicking', 50, 'Baseline'),
      { ...makePayloadEntry('Kicking-Points_', 50, 'Baseline'), name: 'Kicking-Points_' },
    ];
    await render(<ProportionTooltip active={true} payload={entries} figureTextSize="base" />);
    await expect.element(page.getByText(/Kicking Total/).first()).toBeInTheDocument();
    expect(page.getByText(/Kicking Total/).elements().length).toBe(1);
  });

  it('applies large text size class when figureTextSize is large', async () => {
    await render(
      <ProportionTooltip
        active={true}
        payload={[makePayloadEntry('Kicking', 50, 'Baseline')]}
        figureTextSize="large"
      />,
    );
    await expect.element(page.getByText(/Kicking Total/)).toBeInTheDocument();
    expect(document.querySelector('.text-xl')).not.toBeNull();
  });

  it('applies extra large text size class when figureTextSize is extraLarge', async () => {
    await render(
      <ProportionTooltip
        active={true}
        payload={[makePayloadEntry('Kicking', 50, 'Baseline')]}
        figureTextSize="extraLarge"
      />,
    );
    await expect.element(page.getByText(/Kicking Total/)).toBeInTheDocument();
    expect(document.querySelector('.text-2xl')).not.toBeNull();
  });
});
