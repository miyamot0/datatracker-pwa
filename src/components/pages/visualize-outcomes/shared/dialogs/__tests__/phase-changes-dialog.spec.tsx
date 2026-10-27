import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { PhaseChangesDialog } from '../phase-changes-dialog';
import { EMPTY_SERIES_STYLES, type SeriesStyles } from '@/lib/graphing/series-style';

const withLines: SeriesStyles = {
  ...EMPTY_SERIES_STYLES,
  phase_changes: [
    { position: 3, lineType: 'solid' },
    { position: 7.5, lineType: 'dotted' },
  ],
};

describe('PhaseChangesDialog', () => {
  it('shows an empty state when no lines are saved', async () => {
    await render(<PhaseChangesDialog styles={EMPTY_SERIES_STYLES} onChange={vi.fn()} />);

    await page.getByRole('button', { name: 'Edit Phase Changes' }).click();

    await expect.element(page.getByText('No phase change lines.')).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Reset All to Defaults' })).not.toBeInTheDocument();
  });

  it('lists each saved line on its own row with a delete button', async () => {
    await render(<PhaseChangesDialog styles={withLines} onChange={vi.fn()} />);

    await page.getByRole('button', { name: 'Edit Phase Changes' }).click();

    await expect.element(page.getByLabelText('Position for line 1')).toHaveValue(3);
    await expect.element(page.getByLabelText('Position for line 2')).toHaveValue(7.5);
    await expect.element(page.getByRole('button', { name: 'Delete line 1' })).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Delete line 2' })).toBeInTheDocument();
  });

  it('deletes only the chosen line and keeps the rest of the styles', async () => {
    const onChange = vi.fn();
    await render(<PhaseChangesDialog styles={withLines} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Phase Changes' }).click();
    await page.getByRole('button', { name: 'Delete line 1' }).click();

    expect(onChange).toHaveBeenLastCalledWith({
      ...withLines,
      phase_changes: [{ position: 7.5, lineType: 'dotted' }],
    });
  });

  it('adds a line that is saved once its position is a number above zero', async () => {
    const onChange = vi.fn();
    await render(<PhaseChangesDialog styles={EMPTY_SERIES_STYLES} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Phase Changes' }).click();
    await page.getByRole('button', { name: 'Add Line' }).click();

    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_SERIES_STYLES, phase_changes: [] });
    await expect.element(page.getByText('Enter a number greater than 0 to save this line.')).toBeInTheDocument();

    await page.getByLabelText('Position for line 1').fill('4.25');

    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_SERIES_STYLES,
      phase_changes: [{ position: 4.25, lineType: 'solid' }],
    });
  });

  it('does not save a zero or negative position', async () => {
    const onChange = vi.fn();
    await render(<PhaseChangesDialog styles={EMPTY_SERIES_STYLES} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Phase Changes' }).click();
    await page.getByRole('button', { name: 'Add Line' }).click();
    await page.getByLabelText('Position for line 1').fill('0');

    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_SERIES_STYLES, phase_changes: [] });
  });
});
