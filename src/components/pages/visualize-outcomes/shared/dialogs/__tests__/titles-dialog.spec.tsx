import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { TitlesDialog } from '../titles-dialog';
import { EMPTY_FIGURE_LABEL_SETTINGS } from '@/lib/graphing/figure-labels';

describe('TitlesDialog', () => {
  it('shows the rate defaults as placeholders with inputs disabled until overridden', async () => {
    await render(
      <TitlesDialog page="rate" labels={EMPTY_FIGURE_LABEL_SETTINGS} onChange={vi.fn()} open onOpenChange={vi.fn()} />,
    );

    await expect.element(page.getByRole('dialog', { name: 'Titles and Labels' })).toBeInTheDocument();
    await expect.element(page.getByLabelText('Title text')).toBeDisabled();
    await expect
      .element(page.getByLabelText('Title text'))
      .toHaveAttribute('placeholder', 'Visualization of Data as Rates');
    await expect.element(page.getByLabelText('Y-axis text')).toHaveAttribute('placeholder', 'Responses per Min');
  });

  it('enables an input and reports the override flag when its checkbox is checked', async () => {
    const onChange = vi.fn();
    await render(
      <TitlesDialog
        page="proportion"
        labels={EMPTY_FIGURE_LABEL_SETTINGS}
        onChange={onChange}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByRole('checkbox', { name: 'Override x-axis' }).click();

    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FIGURE_LABEL_SETTINGS, overrideXAxis: true });
  });

  it('reports typed text alongside the current settings', async () => {
    const onChange = vi.fn();
    await render(
      <TitlesDialog
        page="rate"
        labels={{ ...EMPTY_FIGURE_LABEL_SETTINGS, overrideTitle: true }}
        onChange={onChange}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByLabelText('Title text').fill('Weekly Rates');

    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_FIGURE_LABEL_SETTINGS,
      overrideTitle: true,
      titleText: 'Weekly Rates',
    });
  });

  it('resets every override and text to the defaults', async () => {
    const onChange = vi.fn();
    await render(
      <TitlesDialog
        page="rate"
        labels={{ ...EMPTY_FIGURE_LABEL_SETTINGS, overrideYAxis: true, yAxisText: 'Custom' }}
        onChange={onChange}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByRole('button', { name: 'Reset to Defaults' }).click();

    expect(onChange).toHaveBeenLastCalledWith(EMPTY_FIGURE_LABEL_SETTINGS);
  });

  it('closes the dialog from Done', async () => {
    const onOpenChange = vi.fn();
    await render(
      <TitlesDialog
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
