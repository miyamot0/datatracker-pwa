import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { TitlesDialog } from '../titles-dialog';
import { EMPTY_FIGURE_LABEL_SETTINGS } from '@/lib/graphing/figure-labels';

describe('TitlesDialog', () => {
  it('shows the rate defaults as placeholders with inputs disabled until overridden', async () => {
    await render(
      <TitlesDialog
        page="rate"
        labels={EMPTY_FIGURE_LABEL_SETTINGS}
        onChange={vi.fn()}
        showTitle
        onShowTitleChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await expect.element(page.getByRole('dialog', { name: 'Titles and Labels' })).toBeInTheDocument();
    await expect.element(page.getByLabelText('Title Text')).toBeDisabled();
    await expect
      .element(page.getByLabelText('Title Text'))
      .toHaveAttribute('placeholder', 'Visualization of Data as Rates');
    await expect.element(page.getByLabelText('Y-Axis Text')).toHaveAttribute('placeholder', 'Responses per Min');
  });

  it('reports hiding the title from the top toggle', async () => {
    const onShowTitleChange = vi.fn();
    await render(
      <TitlesDialog
        page="rate"
        labels={EMPTY_FIGURE_LABEL_SETTINGS}
        onChange={vi.fn()}
        showTitle
        onShowTitleChange={onShowTitleChange}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByRole('checkbox', { name: 'Hide Title' }).click();

    expect(onShowTitleChange).toHaveBeenLastCalledWith(false);
  });

  it('enables an input and reports the override flag when its checkbox is checked', async () => {
    const onChange = vi.fn();
    await render(
      <TitlesDialog
        page="proportion"
        labels={EMPTY_FIGURE_LABEL_SETTINGS}
        onChange={onChange}
        showTitle
        onShowTitleChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByRole('checkbox', { name: 'Override X-Axis' }).click();

    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FIGURE_LABEL_SETTINGS, overrideXAxis: true });
  });

  it('reports typed text alongside the current settings', async () => {
    const onChange = vi.fn();
    await render(
      <TitlesDialog
        page="rate"
        labels={{ ...EMPTY_FIGURE_LABEL_SETTINGS, overrideTitle: true }}
        onChange={onChange}
        showTitle
        onShowTitleChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByLabelText('Title Text').fill('Weekly Rates');

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
        showTitle
        onShowTitleChange={vi.fn()}
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
        showTitle
        onShowTitleChange={vi.fn()}
        open
        onOpenChange={onOpenChange}
      />,
    );

    await page.getByRole('button', { name: 'Done' }).click();

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
