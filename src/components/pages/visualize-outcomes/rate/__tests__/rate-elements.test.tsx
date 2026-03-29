import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
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
  it('renders nothing when active is false', () => {
    const { container } = render(
      <RateTooltip active={false} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline')]} figureTextSize="base" />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when payload is empty', () => {
    const { container } = render(<RateTooltip active={true} payload={[]} figureTextSize="base" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when payload is undefined', () => {
    const { container } = render(<RateTooltip active={true} payload={undefined} figureTextSize="base" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders session number and condition when active', () => {
    render(
      <RateTooltip active={true} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline')]} figureTextSize="base" />,
    );
    expect(screen.getByText(/Session #1 \(Baseline\)/)).not.toBeNull();
  });

  it('renders session time when active', () => {
    render(
      <RateTooltip active={true} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline', 10)]} figureTextSize="base" />,
    );
    expect(screen.getByText(/Session Time: 10 min/)).not.toBeNull();
  });

  it('renders Count and Rate rows for the key', () => {
    render(
      <RateTooltip active={true} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline', 10)]} figureTextSize="base" />,
    );
    expect(screen.getByText(/Kicking Count/)).not.toBeNull();
    expect(screen.getByText(/Kicking Rate/)).not.toBeNull();
  });

  it('renders formatted rate per min', () => {
    render(
      <RateTooltip active={true} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline', 10)]} figureTextSize="base" />,
    );
    expect(screen.getByText('2.50/min')).not.toBeNull();
  });

  it('renders formatted total count (rate × sessionTime)', () => {
    // rate=2.5, sessionTime=10 → total = 25.00
    render(
      <RateTooltip active={true} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline', 10)]} figureTextSize="base" />,
    );
    expect(screen.getByText('25.00')).not.toBeNull();
  });

  it('filters out -Points_ entries from the payload', () => {
    const entries = [
      makePayloadEntry('Kicking', 2.5, 'Baseline'),
      { ...makePayloadEntry('Kicking-Points_', 2.5, 'Baseline'), name: 'Kicking-Points_' },
    ];
    render(<RateTooltip active={true} payload={entries} figureTextSize="base" />);
    const countLabels = screen.getAllByText(/Kicking Count/);
    expect(countLabels.length).toBe(1);
  });

  it('applies large text size class when figureTextSize is large', () => {
    const { container } = render(
      <RateTooltip active={true} payload={[makePayloadEntry('Kicking', 2.5, 'Baseline')]} figureTextSize="large" />,
    );
    expect(container.querySelector('.text-xl')).not.toBeNull();
  });

  it('applies extra large text size class when figureTextSize is extraLarge', () => {
    const { container } = render(
      <RateTooltip
        active={true}
        payload={[makePayloadEntry('Kicking', 2.5, 'Baseline')]}
        figureTextSize="extraLarge"
      />,
    );
    expect(container.querySelector('.text-2xl')).not.toBeNull();
  });
});
