import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import { RateTooltip } from '../rate-elements';

// ----- Helpers -----

const makeRow = (overrides: Record<string, string | number> = {}) => ({
  Condition: 'Baseline',
  session: 1,
  SessionTime: 10,
  Kicking: 2.5,
  ...overrides,
});

// Recharts reports the hovered row through whichever entry it chooses first; the tooltip only reads the row.
const makePayload = (row: Record<string, string | number>, dataKey = 'Kicking') => [
  { dataKey, name: `${dataKey}-Points_`, value: row[dataKey], payload: row },
];

// ----- Tests -----

describe('RateTooltip', () => {
  it('renders nothing when active is false', async () => {
    await render(
      <RateTooltip active={false} payload={makePayload(makeRow())} figureTextSize="base" visibleKeys={['Kicking']} />,
    );
    await expect.element(page.getByText(/Session #/)).not.toBeInTheDocument();
  });

  it('renders nothing when payload is empty', async () => {
    await render(<RateTooltip active={true} payload={[]} figureTextSize="base" visibleKeys={['Kicking']} />);
    await expect.element(page.getByText(/Session #/)).not.toBeInTheDocument();
  });

  it('renders nothing when payload is undefined', async () => {
    await render(<RateTooltip active={true} payload={undefined} figureTextSize="base" visibleKeys={['Kicking']} />);
    await expect.element(page.getByText(/Session #/)).not.toBeInTheDocument();
  });

  it('renders session number and condition when active', async () => {
    await render(
      <RateTooltip active={true} payload={makePayload(makeRow())} figureTextSize="base" visibleKeys={['Kicking']} />,
    );
    await expect.element(page.getByText(/Session #1 \(Baseline\)/)).toBeInTheDocument();
  });

  it('renders session time when active', async () => {
    await render(
      <RateTooltip
        active={true}
        payload={makePayload(makeRow({ SessionTime: 10 }))}
        figureTextSize="base"
        visibleKeys={['Kicking']}
      />,
    );
    await expect.element(page.getByText(/Session Time: 10 min/)).toBeInTheDocument();
  });

  it('renders Count and Rate rows for the key', async () => {
    await render(
      <RateTooltip active={true} payload={makePayload(makeRow())} figureTextSize="base" visibleKeys={['Kicking']} />,
    );
    await expect.element(page.getByText(/Kicking Count/)).toBeInTheDocument();
    await expect.element(page.getByText(/Kicking Rate/)).toBeInTheDocument();
  });

  it('renders formatted rate per min', async () => {
    await render(
      <RateTooltip active={true} payload={makePayload(makeRow())} figureTextSize="base" visibleKeys={['Kicking']} />,
    );
    await expect.element(page.getByText('2.50/min')).toBeInTheDocument();
  });

  it('renders formatted total count (rate × sessionTime)', async () => {
    // rate = 2.5, sessionTime = 10 → count = 25.00
    await render(
      <RateTooltip active={true} payload={makePayload(makeRow())} figureTextSize="base" visibleKeys={['Kicking']} />,
    );
    await expect.element(page.getByText('25.00')).toBeInTheDocument();
  });

  it('shows only the visible keys', async () => {
    const row = makeRow({ Biting: 1 });

    await render(
      <RateTooltip active={true} payload={makePayload(row)} figureTextSize="base" visibleKeys={['Kicking']} />,
    );

    await expect.element(page.getByText(/Kicking Count/)).toBeInTheDocument();
    await expect.element(page.getByText(/Biting Count/)).not.toBeInTheDocument();
  });

  it('does not show a session axis entry as a row', async () => {
    const row = makeRow();
    const payload = [{ dataKey: 'session', name: 'session', value: 1, payload: row }, ...makePayload(row)];

    await render(<RateTooltip active={true} payload={payload} figureTextSize="base" visibleKeys={['Kicking']} />);

    await expect.element(page.getByText(/Kicking Count/)).toBeInTheDocument();
    await expect.element(page.getByText(/session Count/)).not.toBeInTheDocument();
    await expect.element(page.getByText(/session Rate/)).not.toBeInTheDocument();
  });

  it('skips keys whose value is not a finite number', async () => {
    const row = makeRow({ Kicking: Number.NaN, Biting: 1 });

    await render(
      <RateTooltip
        active={true}
        payload={makePayload(row)}
        figureTextSize="base"
        visibleKeys={['Kicking', 'Biting']}
      />,
    );

    await expect.element(page.getByText(/Biting Count/)).toBeInTheDocument();
    await expect.element(page.getByText(/Kicking Count/)).not.toBeInTheDocument();
  });

  it('renders the header without key rows when no keys are visible', async () => {
    await render(<RateTooltip active={true} payload={makePayload(makeRow())} figureTextSize="base" visibleKeys={[]} />);

    await expect.element(page.getByText(/Session #1 \(Baseline\)/)).toBeInTheDocument();
    await expect.element(page.getByText(/Kicking Count/)).not.toBeInTheDocument();
  });

  it('applies large text size class when figureTextSize is large', async () => {
    await render(
      <RateTooltip active={true} payload={makePayload(makeRow())} figureTextSize="large" visibleKeys={['Kicking']} />,
    );
    await expect.element(page.getByText(/Kicking Count/)).toBeInTheDocument();
    expect(document.querySelector('.text-xl')).not.toBeNull();
  });

  it('applies extra large text size class when figureTextSize is extraLarge', async () => {
    await render(
      <RateTooltip
        active={true}
        payload={makePayload(makeRow())}
        figureTextSize="extraLarge"
        visibleKeys={['Kicking']}
      />,
    );
    await expect.element(page.getByText(/Kicking Count/)).toBeInTheDocument();
    expect(document.querySelector('.text-2xl')).not.toBeNull();
  });
});
