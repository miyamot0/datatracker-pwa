import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import { ProportionTooltip } from '../proportion-elements';

// ----- Helpers -----

const makeRow = (overrides: Record<string, string | number> = {}): Record<string, string | number> => ({
  Condition: 'Baseline',
  session: 1,
  SessionTime: 10,
  Kicking: 50,
  'Kicking-Bouts': 3,
  'Kicking-Bout-Ave': 4.5,
  ...overrides,
});

// Recharts reports the hovered row through whichever entry it chooses first; the tooltip only reads the row.
const makePayload = (row: Record<string, string | number>, dataKey = 'Kicking') => [
  { dataKey, name: `${dataKey}-Points_`, value: row[dataKey], payload: row },
];

// ----- Tests -----

describe('ProportionTooltip', () => {
  it('renders nothing when active is false', async () => {
    await render(
      <ProportionTooltip
        active={false}
        payload={makePayload(makeRow())}
        figureTextSize="base"
        visibleKeys={['Kicking']}
      />,
    );
    await expect.element(page.getByText(/Session #/)).not.toBeInTheDocument();
  });

  it('renders nothing when payload is empty', async () => {
    await render(<ProportionTooltip active={true} payload={[]} figureTextSize="base" visibleKeys={['Kicking']} />);
    await expect.element(page.getByText(/Session #/)).not.toBeInTheDocument();
  });

  it('renders nothing when payload is undefined', async () => {
    await render(
      <ProportionTooltip active={true} payload={undefined} figureTextSize="base" visibleKeys={['Kicking']} />,
    );
    await expect.element(page.getByText(/Session #/)).not.toBeInTheDocument();
  });

  it('renders session number and condition when active', async () => {
    await render(
      <ProportionTooltip
        active={true}
        payload={makePayload(makeRow())}
        figureTextSize="base"
        visibleKeys={['Kicking']}
      />,
    );
    await expect.element(page.getByText(/Session #1 \(Baseline\)/)).toBeInTheDocument();
  });

  it('renders session time when active', async () => {
    await render(
      <ProportionTooltip
        active={true}
        payload={makePayload(makeRow({ SessionTime: 10 }))}
        figureTextSize="base"
        visibleKeys={['Kicking']}
      />,
    );
    await expect.element(page.getByText(/Session Time: 10 min/)).toBeInTheDocument();
  });

  it('renders Total and % rows for the key', async () => {
    await render(
      <ProportionTooltip
        active={true}
        payload={makePayload(makeRow())}
        figureTextSize="base"
        visibleKeys={['Kicking']}
      />,
    );
    await expect.element(page.getByText(/Kicking Total/)).toBeInTheDocument();
    await expect.element(page.getByText('300.00s')).toBeInTheDocument();
    await expect.element(page.getByText(/Kicking %/)).toBeInTheDocument();
    await expect.element(page.getByText('50.00%')).toBeInTheDocument();
  });

  it('renders Bouts count row when the row has bout data', async () => {
    await render(
      <ProportionTooltip
        active={true}
        payload={makePayload(makeRow())}
        figureTextSize="base"
        visibleKeys={['Kicking']}
      />,
    );
    await expect.element(page.getByText(/Kicking Bouts/)).toBeInTheDocument();
    await expect.element(page.getByText('3', { exact: true })).toBeInTheDocument();
  });

  it('renders Ave row with formatted value', async () => {
    await render(
      <ProportionTooltip
        active={true}
        payload={makePayload(makeRow())}
        figureTextSize="base"
        visibleKeys={['Kicking']}
      />,
    );
    await expect.element(page.getByText(/Kicking Ave/)).toBeInTheDocument();
    await expect.element(page.getByText('4.50s')).toBeInTheDocument();
  });

  it('renders N/A for bouts and average when bout values are undefined', async () => {
    const row = makeRow();
    delete row['Kicking-Bouts'];
    delete row['Kicking-Bout-Ave'];

    await render(
      <ProportionTooltip active={true} payload={makePayload(row)} figureTextSize="base" visibleKeys={['Kicking']} />,
    );

    expect(page.getByText('N/A', { exact: true }).elements().length).toBe(2);
  });

  it('renders N/A for average when bout average is zero', async () => {
    const row = makeRow({ 'Kicking-Bout-Ave': 0 });

    await render(
      <ProportionTooltip active={true} payload={makePayload(row)} figureTextSize="base" visibleKeys={['Kicking']} />,
    );

    await expect.element(page.getByText(/Kicking Ave/)).toBeInTheDocument();
    expect(page.getByText('N/A', { exact: true }).elements().length).toBe(1);
  });

  it('cleans condition and hyphen from data key labels', async () => {
    const row = makeRow({ 'Baseline-Kicking': 25, 'Baseline-Kicking-Bouts': 1, 'Baseline-Kicking-Bout-Ave': 2 });

    await render(
      <ProportionTooltip
        active={true}
        payload={makePayload(row, 'Baseline-Kicking')}
        figureTextSize="base"
        visibleKeys={['Baseline-Kicking']}
      />,
    );

    await expect.element(page.getByText(/^Kicking Total$/)).toBeInTheDocument();
    await expect.element(page.getByText(/Baseline-Kicking Total/)).not.toBeInTheDocument();
  });

  it('shows only the visible keys, in order', async () => {
    const row = makeRow({ Biting: 20, 'Biting-Bouts': 2, 'Biting-Bout-Ave': 1 });

    await render(
      <ProportionTooltip active={true} payload={makePayload(row)} figureTextSize="base" visibleKeys={['Kicking']} />,
    );

    await expect.element(page.getByText(/Kicking Total/)).toBeInTheDocument();
    await expect.element(page.getByText(/Biting Total/)).not.toBeInTheDocument();
  });

  it('does not show a session axis entry as a row', async () => {
    const row = makeRow();
    const payload = [{ dataKey: 'session', name: 'session', value: 1, payload: row }, ...makePayload(row)];

    await render(<ProportionTooltip active={true} payload={payload} figureTextSize="base" visibleKeys={['Kicking']} />);

    await expect.element(page.getByText(/Kicking Total/)).toBeInTheDocument();
    await expect.element(page.getByText(/session Total/)).not.toBeInTheDocument();
  });

  it('renders the same rows whichever entry the hover reports first', async () => {
    const row = makeRow();
    const axisPayload = [{ dataKey: 'Kicking', name: 'Kicking-Points_', value: 50, payload: row }];
    const dotPayload = [{ dataKey: 'session', name: 'session', value: 1, payload: row }];

    await render(
      <ProportionTooltip active={true} payload={axisPayload} figureTextSize="base" visibleKeys={['Kicking']} />,
    );
    await expect.element(page.getByText(/Kicking Total/)).toBeInTheDocument();
    await expect.element(page.getByText(/session Total/)).not.toBeInTheDocument();

    await render(
      <ProportionTooltip active={true} payload={dotPayload} figureTextSize="base" visibleKeys={['Kicking']} />,
    );
    await expect.element(page.getByText(/Kicking Total/).last()).toBeInTheDocument();
    await expect.element(page.getByText(/session Total/)).not.toBeInTheDocument();
  });

  it('skips keys whose value is not a finite number', async () => {
    const row = makeRow({ Kicking: Number.NaN, Biting: 25, 'Biting-Bouts': 1, 'Biting-Bout-Ave': 2 });

    await render(
      <ProportionTooltip
        active={true}
        payload={makePayload(row)}
        figureTextSize="base"
        visibleKeys={['Kicking', 'Biting']}
      />,
    );

    await expect.element(page.getByText(/Biting Total/)).toBeInTheDocument();
    await expect.element(page.getByText(/Kicking Total/)).not.toBeInTheDocument();
  });

  it('renders the header without key rows when no keys are visible', async () => {
    await render(
      <ProportionTooltip active={true} payload={makePayload(makeRow())} figureTextSize="base" visibleKeys={[]} />,
    );

    await expect.element(page.getByText(/Session #1 \(Baseline\)/)).toBeInTheDocument();
    await expect.element(page.getByText(/Kicking Total/)).not.toBeInTheDocument();
  });

  it('applies large text size class when figureTextSize is large', async () => {
    await render(
      <ProportionTooltip
        active={true}
        payload={makePayload(makeRow())}
        figureTextSize="large"
        visibleKeys={['Kicking']}
      />,
    );
    await expect.element(page.getByText(/Kicking Total/)).toBeInTheDocument();
    expect(document.querySelector('.text-xl')).not.toBeNull();
  });

  it('applies extra large text size class when figureTextSize is extraLarge', async () => {
    await render(
      <ProportionTooltip
        active={true}
        payload={makePayload(makeRow())}
        figureTextSize="extraLarge"
        visibleKeys={['Kicking']}
      />,
    );
    await expect.element(page.getByText(/Kicking Total/)).toBeInTheDocument();
    expect(document.querySelector('.text-2xl')).not.toBeNull();
  });
});
