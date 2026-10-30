import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { AxisLabelsDialog } from '../axis-labels-dialog';
import { EMPTY_FIGURE_LABEL_SETTINGS } from '@/lib/graphing/figure-labels';

describe('AxisLabelsDialog', () => {
  it('shows the rate axis defaults as placeholders with inputs disabled until overridden', async () => {
    await render(
      <AxisLabelsDialog
        page="rate"
        labels={EMPTY_FIGURE_LABEL_SETTINGS}
        onChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await expect.element(page.getByRole('dialog', { name: 'Axis Labels' })).toBeInTheDocument();
    await expect.element(page.getByLabelText('X-Axis Label Text')).toBeDisabled();
    await expect.element(page.getByLabelText('Y-Axis Label Text')).toBeDisabled();
    await expect.element(page.getByLabelText('Y-Axis Label Text')).toHaveAttribute('placeholder', 'Responses per Min');
  });

  it('enables an input and reports the override flag when its checkbox is checked', async () => {
    const onChange = vi.fn();
    await render(
      <AxisLabelsDialog
        page="proportion"
        labels={EMPTY_FIGURE_LABEL_SETTINGS}
        onChange={onChange}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByRole('checkbox', { name: 'Override X-Axis', exact: true }).click();

    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FIGURE_LABEL_SETTINGS, overrideXAxis: true });
  });

  it('reports typed text alongside the current settings', async () => {
    const onChange = vi.fn();
    await render(
      <AxisLabelsDialog
        page="rate"
        labels={{ ...EMPTY_FIGURE_LABEL_SETTINGS, overrideYAxis: true }}
        onChange={onChange}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByLabelText('Y-Axis Label Text').fill('Responses');

    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_FIGURE_LABEL_SETTINGS,
      overrideYAxis: true,
      yAxisText: 'Responses',
    });
  });

  it('resets both axis labels without touching the title', async () => {
    const onChange = vi.fn();
    await render(
      <AxisLabelsDialog
        page="rate"
        labels={{
          ...EMPTY_FIGURE_LABEL_SETTINGS,
          overrideYAxis: true,
          yAxisText: 'Custom',
          overrideTitle: true,
          titleText: 'Keep',
        }}
        onChange={onChange}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByRole('button', { name: 'Reset to Defaults' }).click();

    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_FIGURE_LABEL_SETTINGS,
      overrideTitle: true,
      titleText: 'Keep',
    });
  });

  it('closes the dialog from Done', async () => {
    const onOpenChange = vi.fn();
    await render(
      <AxisLabelsDialog
        page="rate"
        labels={EMPTY_FIGURE_LABEL_SETTINGS}
        onChange={vi.fn()}
        open
        onOpenChange={onOpenChange}
      />,
    );

    await page.getByRole('button', { name: 'Done' }).click();

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
