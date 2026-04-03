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

describe('PaddedTimerRow - running state classes', () => {
  it('applies gray bg when Running and AssignedTimer is undefined', async () => {
    await render(
      <PaddedTimerRow
        ActiveTimer="Stopped"
        AssignedTimer={undefined}
        SecondsElapsed={0}
        SecondsDelta={0}
        Running={true}
      />,
    );
    const timeEl = page.getByText('0s');
    await expect.element(timeEl).toHaveClass('bg-gray-500');
  });

  it('applies green bg when Running and Primary ActiveTimer matches Primary AssignedTimer', async () => {
    await render(
      <PaddedTimerRow
        ActiveTimer="Primary"
        AssignedTimer="Primary"
        SecondsElapsed={10}
        SecondsDelta={0}
        Running={true}
      />,
    );
    const timeEl = page.getByText('10s');
    await expect.element(timeEl).toHaveClass('bg-green-500');
  });

  it('applies orange bg when Running and Secondary ActiveTimer matches Secondary AssignedTimer', async () => {
    await render(
      <PaddedTimerRow
        ActiveTimer="Secondary"
        AssignedTimer="Secondary"
        SecondsElapsed={20}
        SecondsDelta={0}
        Running={true}
      />,
    );
    const timeEl = page.getByText('20s');
    await expect.element(timeEl).toHaveClass('bg-orange-500');
  });

  it('applies red bg when Running and Tertiary ActiveTimer matches Tertiary AssignedTimer', async () => {
    await render(
      <PaddedTimerRow
        ActiveTimer="Tertiary"
        AssignedTimer="Tertiary"
        SecondsElapsed={15}
        SecondsDelta={0}
        Running={true}
      />,
    );
    const timeEl = page.getByText('15s');
    await expect.element(timeEl).toHaveClass('bg-red-500');
  });

  it('does not apply active color when primary timer not running', async () => {
    await render(
      <PaddedTimerRow
        ActiveTimer="Primary"
        AssignedTimer="Primary"
        SecondsElapsed={5}
        SecondsDelta={0}
        Running={false}
      />,
    );
    const timeEl = page.getByText('5s');
    await expect.element(timeEl).not.toHaveClass('bg-green-500');
  });
});

describe('PaddedTimerRow - delta display', () => {
  it('shows + delta for Secondary when ActiveTimer matches AssignedTimer', async () => {
    await render(
      <PaddedTimerRow
        ActiveTimer="Secondary"
        AssignedTimer="Secondary"
        SecondsElapsed={0}
        SecondsDelta={12}
        Running={true}
      />,
    );
    await expect.element(page.getByText(/\+ 12m/)).toBeInTheDocument();
  });

  it('does not show delta for Secondary when ActiveTimer does not match', async () => {
    await render(
      <PaddedTimerRow
        ActiveTimer="Primary"
        AssignedTimer="Secondary"
        SecondsElapsed={0}
        SecondsDelta={12}
        Running={true}
      />,
    );
    expect(page.getByText(/\+ 12m/).elements().length).toBe(0);
  });

  it('shows + delta for Tertiary when ActiveTimer matches AssignedTimer', async () => {
    await render(
      <PaddedTimerRow
        ActiveTimer="Tertiary"
        AssignedTimer="Tertiary"
        SecondsElapsed={0}
        SecondsDelta={8}
        Running={true}
      />,
    );
    await expect.element(page.getByText(/\+ 8m/)).toBeInTheDocument();
  });

  it('does not show delta for Tertiary when ActiveTimer does not match', async () => {
    await render(
      <PaddedTimerRow
        ActiveTimer="Primary"
        AssignedTimer="Tertiary"
        SecondsElapsed={0}
        SecondsDelta={8}
        Running={true}
      />,
    );
    expect(page.getByText(/\+ 8m/).elements().length).toBe(0);
  });
});
