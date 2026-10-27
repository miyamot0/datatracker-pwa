import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { LegendDialog } from '../legend-dialog';
import { DEFAULT_LEGEND_SETTINGS } from '@/lib/graphing/legend-settings';

describe('LegendDialog', () => {
  it('shows the current position and layout', async () => {
    await render(
      <LegendDialog
        settings={{ position: 'upper-left', layout: 'vertical' }}
        onChange={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await expect.element(page.getByRole('dialog', { name: 'Legend Position and Layout' })).toBeInTheDocument();
    await expect.element(page.getByRole('combobox', { name: 'Legend position', exact: true })).toHaveTextContent('Upper Left');
    await expect.element(page.getByRole('combobox', { name: 'Legend layout', exact: true })).toHaveTextContent('Vertical');
  });

  it('reports a newly selected position while keeping the layout', async () => {
    const onChange = vi.fn();
    await render(<LegendDialog settings={DEFAULT_LEGEND_SETTINGS} onChange={onChange} open onOpenChange={vi.fn()} />);

    await page.getByRole('combobox', { name: 'Legend position', exact: true }).click();
    await page.getByRole('option', { name: 'Middle Right' }).click();

    expect(onChange).toHaveBeenLastCalledWith({ position: 'mid-right', layout: 'horizontal' });
  });

  it('reports a newly selected layout while keeping the position', async () => {
    const onChange = vi.fn();
    await render(
      <LegendDialog
        settings={{ position: 'lower-right', layout: 'horizontal' }}
        onChange={onChange}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByRole('combobox', { name: 'Legend layout', exact: true }).click();
    await page.getByRole('option', { name: 'Vertical' }).click();

    expect(onChange).toHaveBeenLastCalledWith({ position: 'lower-right', layout: 'vertical' });
  });

  it('resets position and layout to the defaults', async () => {
    const onChange = vi.fn();
    await render(
      <LegendDialog
        settings={{ position: 'upper-right', layout: 'vertical' }}
        onChange={onChange}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await page.getByRole('button', { name: 'Reset to Defaults' }).click();

    expect(onChange).toHaveBeenLastCalledWith(DEFAULT_LEGEND_SETTINGS);
  });

  it('closes the dialog from Done', async () => {
    const onOpenChange = vi.fn();
    await render(
      <LegendDialog settings={DEFAULT_LEGEND_SETTINGS} onChange={vi.fn()} open onOpenChange={onOpenChange} />,
    );

    await page.getByRole('button', { name: 'Done' }).click();

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});
