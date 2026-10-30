import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { AxisLimitsDialog } from '../axis-limits-dialog';
import { EMPTY_FIGURE_AXIS_MAX_SETTINGS } from '@/lib/graphing/figure-text-settings';

describe('AxisLimitsDialog', () => {
  it('keeps the X max input disabled until its override is checked', async () => {
    await render(
      <AxisLimitsDialog
        page="proportion"
        axisMax={EMPTY_FIGURE_AXIS_MAX_SETTINGS}
        onAxisMaxChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await expect.element(page.getByRole('dialog', { name: 'Axis Limits' })).toBeInTheDocument();
    await expect.element(page.getByRole('spinbutton', { name: 'X-Axis Max', exact: true })).toBeDisabled();
  });

  it('enables the X max input when overridden and reports a whole number above zero', async () => {
    const onAxisMaxChange = vi.fn();
    await render(
      <AxisLimitsDialog
        page="proportion"
        axisMax={{ ...EMPTY_FIGURE_AXIS_MAX_SETTINGS, overrideXMax: true }}
        onAxisMaxChange={onAxisMaxChange}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await expect.element(page.getByRole('spinbutton', { name: 'X-Axis Max', exact: true })).toBeEnabled();
    await page.getByRole('spinbutton', { name: 'X-Axis Max', exact: true }).fill('500');

    expect(onAxisMaxChange).toHaveBeenLastCalledWith({
      ...EMPTY_FIGURE_AXIS_MAX_SETTINGS,
      overrideXMax: true,
      xMax: 500,
    });
  });

  it('does not offer a Y max override on proportion', async () => {
    await render(
      <AxisLimitsDialog
        page="proportion"
        axisMax={EMPTY_FIGURE_AXIS_MAX_SETTINGS}
        onAxisMaxChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await expect.element(page.getByRole('checkbox', { name: 'Override X-Axis Max' })).toBeInTheDocument();
    await expect.element(page.getByRole('checkbox', { name: 'Override Y-Axis Max' })).not.toBeInTheDocument();
  });

  it('offers a Y max override on rate', async () => {
    await render(
      <AxisLimitsDialog
        page="rate"
        axisMax={EMPTY_FIGURE_AXIS_MAX_SETTINGS}
        onAxisMaxChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await expect.element(page.getByRole('checkbox', { name: 'Override Y-Axis Max' })).toBeInTheDocument();
  });

  it('resets every axis max override to the defaults', async () => {
    const onAxisMaxChange = vi.fn();
    await render(
      <AxisLimitsDialog
        page="rate"
        axisMax={{ overrideXMax: true, xMax: 500, overrideYMax: true, yMax: 20 }}
        onAxisMaxChange={onAxisMaxChange}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByRole('button', { name: 'Reset to Defaults' }).click();

    expect(onAxisMaxChange).toHaveBeenLastCalledWith(EMPTY_FIGURE_AXIS_MAX_SETTINGS);
  });

  it('closes the dialog from Done', async () => {
    const onOpenChange = vi.fn();
    await render(
      <AxisLimitsDialog
        page="rate"
        axisMax={EMPTY_FIGURE_AXIS_MAX_SETTINGS}
        onAxisMaxChange={vi.fn()}
        open
        onOpenChange={onOpenChange}
      />,
    );

    await page.getByRole('button', { name: 'Done' }).click();

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
