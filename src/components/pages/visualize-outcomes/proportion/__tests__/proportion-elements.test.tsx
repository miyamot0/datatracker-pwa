import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
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
  it('renders nothing when active is false', () => {
    const { container } = render(
      <ProportionTooltip
        active={false}
        payload={[makePayloadEntry('Kicking', 50, 'Baseline')]}
        figureTextSize="base"
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when payload is empty', () => {
    const { container } = render(<ProportionTooltip active={true} payload={[]} figureTextSize="base" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when payload is undefined', () => {
    const { container } = render(<ProportionTooltip active={true} payload={undefined} figureTextSize="base" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders session number and condition when active', () => {
    render(
      <ProportionTooltip active={true} payload={[makePayloadEntry('Kicking', 50, 'Baseline')]} figureTextSize="base" />,
    );
    expect(screen.getByText(/Session #1 \(Baseline\)/)).not.toBeNull();
  });

  it('renders session time when active', () => {
    render(
      <ProportionTooltip
        active={true}
        payload={[makePayloadEntry('Kicking', 50, 'Baseline', 10)]}
        figureTextSize="base"
      />,
    );
    expect(screen.getByText(/Session Time: 10 min/)).not.toBeNull();
  });

  it('renders Total and % rows for the key', () => {
    render(
      <ProportionTooltip
        active={true}
        payload={[makePayloadEntry('Kicking', 50, 'Baseline', 10)]}
        figureTextSize="base"
      />,
    );
    expect(screen.getByText(/Kicking Total/)).not.toBeNull();
    expect(screen.getByText(/Kicking %/)).not.toBeNull();
  });

  it('renders Bouts count row when payload has bout data', () => {
    render(
      <ProportionTooltip active={true} payload={[makePayloadEntry('Kicking', 50, 'Baseline')]} figureTextSize="base" />,
    );
    expect(screen.getByText(/Kicking Bouts/)).not.toBeNull();
    expect(screen.getByText('3')).not.toBeNull();
  });

  it('renders Ave row with formatted value', () => {
    render(
      <ProportionTooltip active={true} payload={[makePayloadEntry('Kicking', 50, 'Baseline')]} figureTextSize="base" />,
    );
    expect(screen.getByText(/Kicking Ave/)).not.toBeNull();
    expect(screen.getByText('4.50s')).not.toBeNull();
  });

  it('filters out -Points_ entries from the payload', () => {
    const entries = [
      makePayloadEntry('Kicking', 50, 'Baseline'),
      { ...makePayloadEntry('Kicking-Points_', 50, 'Baseline'), name: 'Kicking-Points_' },
    ];
    render(<ProportionTooltip active={true} payload={entries} figureTextSize="base" />);
    // Only one "Kicking Total" row should appear (not two)
    const totals = screen.getAllByText(/Kicking Total/);
    expect(totals.length).toBe(1);
  });

  it('applies large text size class when figureTextSize is large', () => {
    const { container } = render(
      <ProportionTooltip
        active={true}
        payload={[makePayloadEntry('Kicking', 50, 'Baseline')]}
        figureTextSize="large"
      />,
    );
    expect(container.querySelector('.text-xl')).not.toBeNull();
  });

  it('applies extra large text size class when figureTextSize is extraLarge', () => {
    const { container } = render(
      <ProportionTooltip
        active={true}
        payload={[makePayloadEntry('Kicking', 50, 'Baseline')]}
        figureTextSize="extraLarge"
      />,
    );
    expect(container.querySelector('.text-2xl')).not.toBeNull();
  });
});
