import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
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
  it('renders the label', async () => {
    await render(<PaddedRow label="Session:" value="1" />);
    await expect.element(page.getByText('Session:')).toBeInTheDocument();
  });

  it('renders the value', async () => {
    await render(<PaddedRow label="Session:" value="Baseline" />);
    await expect.element(page.getByText('Baseline')).toBeInTheDocument();
  });

  it('renders label with font-semibold class', async () => {
    await render(<PaddedRow label="MyLabel" value="val" />);
    await expect.element(page.getByText('MyLabel')).toHaveClass('font-semibold');
  });
});

describe('PaddedTimerRow', () => {
  const baseProps = {
    ActiveTimer: 'Primary' as const,
    SecondsElapsed: 30,
    SecondsDelta: 5,
    Running: true,
  };

  it('renders Total Time label when no AssignedTimer', async () => {
    await render(<PaddedTimerRow {...baseProps} AssignedTimer={undefined} />);
    await expect.element(page.getByText('Total Time:')).toBeInTheDocument();
  });

  it('renders Schedule 1 Time label for Primary', async () => {
    await render(<PaddedTimerRow {...baseProps} AssignedTimer="Primary" />);
    await expect.element(page.getByText('Schedule 1 Time:')).toBeInTheDocument();
  });

  it('renders Schedule 2 Time label for Secondary', async () => {
    await render(<PaddedTimerRow {...baseProps} ActiveTimer="Secondary" AssignedTimer="Secondary" />);
    await expect.element(page.getByText('Schedule 2 Time:')).toBeInTheDocument();
  });

  it('renders Schedule 3 Time label for Tertiary', async () => {
    await render(<PaddedTimerRow {...baseProps} ActiveTimer="Tertiary" AssignedTimer="Tertiary" />);
    await expect.element(page.getByText('Schedule 3 Time:')).toBeInTheDocument();
  });

  it('renders formatted elapsed time', async () => {
    await render(<PaddedTimerRow {...baseProps} AssignedTimer={undefined} SecondsElapsed={30} />);
    await expect.element(page.getByText(/30s/)).toBeInTheDocument();
  });

  it('shows delta when ActiveTimer matches AssignedTimer for Secondary', async () => {
    await render(<PaddedTimerRow {...baseProps} ActiveTimer="Secondary" AssignedTimer="Secondary" SecondsDelta={7} />);
    await expect.element(page.getByText(/7m/)).toBeInTheDocument();
  });
});

