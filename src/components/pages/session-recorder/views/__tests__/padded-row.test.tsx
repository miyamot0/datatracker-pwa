import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// ----- Module mocks -----

vi.mock('@/lib/time', () => ({
  formatTimeSeconds: (s: number) => `${s}s`,
  formatTimeSecondsMin: (s: number) => `${s}m`,
}));

// ----- Import under test -----

import { PaddedRow, PaddedTimerRow } from '../padded-row';

// ----- Tests -----

describe('PaddedRow', () => {
  it('renders the label', () => {
    render(<PaddedRow label="Session:" value="1" />);
    expect(screen.getByText('Session:')).not.toBeNull();
  });

  it('renders the value', () => {
    render(<PaddedRow label="Session:" value="Baseline" />);
    expect(screen.getByText('Baseline')).not.toBeNull();
  });

  it('renders label with font-semibold class', () => {
    render(<PaddedRow label="MyLabel" value="val" />);
    const el = screen.getByText('MyLabel');
    expect(el.className).toContain('font-semibold');
  });
});

describe('PaddedTimerRow', () => {
  const baseProps = {
    ActiveTimer: 'Primary' as const,
    SecondsElapsed: 30,
    SecondsDelta: 5,
    Running: true,
  };

  it('renders Total Time label when no AssignedTimer', () => {
    render(<PaddedTimerRow {...baseProps} AssignedTimer={undefined} />);
    expect(screen.getByText('Total Time:')).not.toBeNull();
  });

  it('renders Schedule 1 Time label for Primary', () => {
    render(<PaddedTimerRow {...baseProps} AssignedTimer="Primary" />);
    expect(screen.getByText('Schedule 1 Time:')).not.toBeNull();
  });

  it('renders Schedule 2 Time label for Secondary', () => {
    render(<PaddedTimerRow {...baseProps} ActiveTimer="Secondary" AssignedTimer="Secondary" />);
    expect(screen.getByText('Schedule 2 Time:')).not.toBeNull();
  });

  it('renders Schedule 3 Time label for Tertiary', () => {
    render(<PaddedTimerRow {...baseProps} ActiveTimer="Tertiary" AssignedTimer="Tertiary" />);
    expect(screen.getByText('Schedule 3 Time:')).not.toBeNull();
  });

  it('renders formatted elapsed time', () => {
    render(<PaddedTimerRow {...baseProps} AssignedTimer={undefined} SecondsElapsed={30} />);
    expect(screen.getByText(/30s/)).not.toBeNull();
  });

  it('shows delta when ActiveTimer matches AssignedTimer for Secondary', () => {
    render(<PaddedTimerRow {...baseProps} ActiveTimer="Secondary" AssignedTimer="Secondary" SecondsDelta={7} />);
    expect(screen.getByText(/7m/)).not.toBeNull();
  });
});
