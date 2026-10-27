import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { SeriesStylesDialog } from '../series-styles-dialog';
import { EMPTY_SERIES_STYLES, type SeriesStyles } from '@/lib/graphing/series-style';

const styled: SeriesStyles = {
  KeyStyles: { Hitting: { shape: 'star' } },
  ConditionStyles: { Baseline: { color: '#FF0000' } },
  phase_changes: [],
  text_annotations: [],
};

describe('SeriesStylesDialog', () => {
  it('shows condition fills and the first key’s settings when opened', async () => {
    await render(
      <SeriesStylesDialog
        keys={[
          { KeyDescription: 'Hitting', Visible: true },
          { KeyDescription: 'Kicking', Visible: true },
        ]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={EMPTY_SERIES_STYLES}
        onChange={vi.fn()}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();

    await expect.element(page.getByText('Marker fill (Baseline)').first()).toBeInTheDocument();
    await expect.element(page.getByText('Line (Baseline)')).toBeInTheDocument();
    await expect.element(page.getByRole('combobox', { name: 'Select key' })).toHaveTextContent('Hitting');
    await expect.element(page.getByText('Default (circle)')).toBeInTheDocument();
  });

  it('omits hidden keys and defaults shapes by visible position', async () => {
    await render(
      <SeriesStylesDialog
        keys={[
          { KeyDescription: 'Subsumed', Visible: false },
          { KeyDescription: 'Kicking', Visible: true },
        ]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={EMPTY_SERIES_STYLES}
        onChange={vi.fn()}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();

    await expect.element(page.getByRole('combobox', { name: 'Select key' })).toHaveTextContent('Kicking');
    await expect.element(page.getByText('Default (circle)')).toBeInTheDocument();

    await page.getByRole('combobox', { name: 'Select key' }).click();
    await expect.element(page.getByRole('option', { name: 'Kicking' })).toBeInTheDocument();
    await expect.element(page.getByRole('option', { name: 'Subsumed' })).not.toBeInTheDocument();
  });

  it('resets all styles to an empty state', async () => {
    const onChange = vi.fn();

    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={{
          ...styled,
          phase_changes: [{ position: 4, lineType: 'dotted' }],
          text_annotations: [{ label: 'Note', x: 2, y: 50, anchor: 'top-left', justify: 'left' }],
        }}
        onChange={onChange}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await page.getByRole('button', { name: 'Reset All to Defaults' }).click();

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_SERIES_STYLES,
      phase_changes: [{ position: 4, lineType: 'dotted' }],
      text_annotations: [{ label: 'Note', x: 2, y: 50, anchor: 'top-left', justify: 'left' }],
    });
  });
});
