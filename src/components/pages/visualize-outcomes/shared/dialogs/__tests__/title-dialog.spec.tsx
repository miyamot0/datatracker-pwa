import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { TitleDialog } from '../title-dialog';
import { EMPTY_FIGURE_LABEL_SETTINGS } from '@/lib/graphing/figure-labels';

describe('TitleDialog', () => {
  it('shows the rate default as placeholder with input disabled until overridden', async () => {
    await render(
      <TitleDialog
        page="rate"
        labels={EMPTY_FIGURE_LABEL_SETTINGS}
        onChange={vi.fn()}
        showTitle
        onShowTitleChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await expect.element(page.getByRole('dialog', { name: 'Title' })).toBeInTheDocument();
    await expect.element(page.getByLabelText('Title Text')).toBeDisabled();
    await expect
      .element(page.getByLabelText('Title Text'))
      .toHaveAttribute('placeholder', 'Visualization of Data as Rates');
  });

  it('reports hiding the title from the Hide Title toggle', async () => {
    const onShowTitleChange = vi.fn();
    await render(
      <TitleDialog
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

  it('reports the override flag when the title override is checked', async () => {
    const onChange = vi.fn();
    await render(
      <TitleDialog
        page="proportion"
        labels={EMPTY_FIGURE_LABEL_SETTINGS}
        onChange={onChange}
        showTitle
        onShowTitleChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByRole('checkbox', { name: 'Override Title', exact: true }).click();

    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_FIGURE_LABEL_SETTINGS, overrideTitle: true });
  });

  it('reports typed title text alongside the current settings', async () => {
    const onChange = vi.fn();
    await render(
      <TitleDialog
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

  it('resets the title override and text without touching axis labels', async () => {
    const onChange = vi.fn();
    await render(
      <TitleDialog
        page="rate"
        labels={{ ...EMPTY_FIGURE_LABEL_SETTINGS, overrideTitle: true, titleText: 'Custom', overrideXAxis: true }}
        onChange={onChange}
        showTitle
        onShowTitleChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByRole('button', { name: 'Reset to Defaults' }).click();

    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_FIGURE_LABEL_SETTINGS,
      overrideXAxis: true,
    });
  });

  it('closes the dialog from Done', async () => {
    const onOpenChange = vi.fn();
    await render(
      <TitleDialog
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
