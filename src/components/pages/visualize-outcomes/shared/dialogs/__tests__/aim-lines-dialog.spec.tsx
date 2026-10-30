import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { AimLinesDialog } from '../aim-lines-dialog';
import { EMPTY_SERIES_STYLES, type SeriesStyles } from '@/lib/graphing/series-style';

const withAimLines: SeriesStyles = {
  ...EMPTY_SERIES_STYLES,
  aim_lines: [
    { x1: 1, x2: 5, y: 40, lineType: 'dashed', color: '#000000', page: 'rate' },
    { x1: 2, x2: 8, y: 0.5, lineType: 'dotted', color: '#FFFFFF', page: 'proportion' },
  ],
};

describe('AimLinesDialog', () => {
  it('shows an empty state when no aim lines are saved', async () => {
    await render(<AimLinesDialog page="rate" styles={EMPTY_SERIES_STYLES} onChange={vi.fn()} />);

    await page.getByRole('button', { name: 'Edit Aim Lines' }).click();
    await expect.element(page.getByText('No aim lines.')).toBeInTheDocument();
  });

  it('lists only the aim lines added on this page with editable fields', async () => {
    await render(<AimLinesDialog page="rate" styles={withAimLines} onChange={vi.fn()} />);

    await page.getByRole('button', { name: 'Edit Aim Lines' }).click();

    await expect.element(page.getByLabelText('X1 for aim line 1')).toHaveValue(1);
    await expect.element(page.getByLabelText('X2 for aim line 1')).toHaveValue(5);
    await expect.element(page.getByLabelText('Y for aim line 1')).toHaveValue(40);
    await expect.element(page.getByRole('button', { name: 'Delete aim line 1' })).toBeInTheDocument();
    expect(page.getByLabelText('Y for aim line 2').elements()).toHaveLength(0);
  });

  it('deletes only the chosen aim line and keeps the other page entries', async () => {
    const onChange = vi.fn();
    const both: SeriesStyles = {
      ...EMPTY_SERIES_STYLES,
      aim_lines: [
        ...withAimLines.aim_lines,
        { x1: 0, x2: 9, y: 12, lineType: 'solid', color: '#000000', page: 'rate' },
      ],
    };
    await render(<AimLinesDialog page="rate" styles={both} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Aim Lines' }).click();
    await page.getByRole('button', { name: 'Delete aim line 1' }).click();

    expect(onChange).toHaveBeenLastCalledWith({
      ...both,
      aim_lines: [withAimLines.aim_lines[1], both.aim_lines[2]],
    });
  });

  it('edits a saved coordinate and saves the change live', async () => {
    const onChange = vi.fn();
    await render(<AimLinesDialog page="rate" styles={withAimLines} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Aim Lines' }).click();
    await page.getByLabelText('Y for aim line 1').fill('55');

    expect(onChange).toHaveBeenLastCalledWith({
      ...withAimLines,
      aim_lines: [withAimLines.aim_lines[1], { ...withAimLines.aim_lines[0], y: 55 }],
    });
  });

  it('adds an aim line that is saved once X1, X2, and Y are all entered', async () => {
    const onChange = vi.fn();
    await render(<AimLinesDialog page="rate" styles={EMPTY_SERIES_STYLES} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Aim Lines' }).click();
    await page.getByRole('button', { name: 'Add Aim Line' }).click();

    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_SERIES_STYLES, aim_lines: [] });
    await expect.element(page.getByText('Enter numbers for X1, X2, and Y to save this aim line.')).toBeInTheDocument();

    await page.getByLabelText('X1 for aim line 1').fill('2');
    await page.getByLabelText('X2 for aim line 1').fill('6');
    await page.getByLabelText('Y for aim line 1').fill('30');

    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_SERIES_STYLES,
      aim_lines: [{ x1: 2, x2: 6, y: 30, lineType: 'dashed', color: '#9061C2', page: 'rate' }],
    });
  });

  it('does not save a coordinate that is not a finite number', async () => {
    const onChange = vi.fn();
    await render(<AimLinesDialog page="rate" styles={EMPTY_SERIES_STYLES} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Aim Lines' }).click();
    await page.getByRole('button', { name: 'Add Aim Line' }).click();
    await page.getByLabelText('X1 for aim line 1').fill('1e999');
    await page.getByLabelText('X2 for aim line 1').fill('6');
    await page.getByLabelText('Y for aim line 1').fill('30');

    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_SERIES_STYLES, aim_lines: [] });
  });

  it('treats styles without an aim line list as empty', async () => {
    const styles = { ...EMPTY_SERIES_STYLES, aim_lines: undefined } as unknown as SeriesStyles;
    const onChange = vi.fn();
    await render(<AimLinesDialog page="rate" styles={styles} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Aim Lines' }).click();
    await expect.element(page.getByText('No aim lines.')).toBeInTheDocument();

    await page.getByRole('button', { name: 'Add Aim Line' }).click();

    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_SERIES_STYLES, aim_lines: [] });
  });

  it('edits only the chosen row when several aim lines share a page', async () => {
    const onChange = vi.fn();
    const samePage: SeriesStyles = {
      ...EMPTY_SERIES_STYLES,
      aim_lines: [
        { x1: 1, x2: 5, y: 40, lineType: 'dashed', color: '#000000', page: 'rate' },
        { x1: 2, x2: 8, y: 12, lineType: 'solid', color: '#FFFFFF', page: 'rate' },
      ],
    };
    await render(<AimLinesDialog page="rate" styles={samePage} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Aim Lines' }).click();
    await page.getByLabelText('Y for aim line 1').fill('55');

    expect(onChange).toHaveBeenLastCalledWith({
      ...samePage,
      aim_lines: [{ ...samePage.aim_lines[0], y: 55 }, samePage.aim_lines[1]],
    });
  });

  it('saves a new line type and color picked for an aim line', async () => {
    const onChange = vi.fn();
    await render(<AimLinesDialog page="rate" styles={withAimLines} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Aim Lines' }).click();
    await page.getByRole('combobox', { name: 'Line type for aim line 1' }).click();
    await page.getByRole('option', { name: 'Solid' }).click();

    expect(onChange).toHaveBeenLastCalledWith({
      ...withAimLines,
      aim_lines: [withAimLines.aim_lines[1], { ...withAimLines.aim_lines[0], lineType: 'solid' }],
    });

    await page.getByRole('combobox', { name: 'Color for aim line 1' }).click();
    await page.getByRole('option').first().click();

    expect(onChange.mock.lastCall?.[0].aim_lines[0].color).not.toBe('#000000');
  });

  it('closes the dialog when Done is pressed', async () => {
    await render(<AimLinesDialog page="rate" styles={withAimLines} onChange={vi.fn()} />);

    await page.getByRole('button', { name: 'Edit Aim Lines' }).click();
    await expect.element(page.getByRole('button', { name: 'Done' })).toBeInTheDocument();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect.element(page.getByRole('button', { name: 'Done' })).not.toBeInTheDocument();
  });
});
