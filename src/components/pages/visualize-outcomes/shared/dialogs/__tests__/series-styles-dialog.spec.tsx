import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { SeriesStylesDialog } from '../series-styles-dialog';
import {
  EMPTY_SERIES_STYLES,
  SERIES_COLOR_PALETTE,
  TRANSPARENT_COLOR,
  type SeriesStyles,
} from '@/lib/graphing/series-style';

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
    await expect.element(page.getByText('Default (circle)').first()).toBeInTheDocument();
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
    await expect.element(page.getByText('Default (circle)').first()).toBeInTheDocument();

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

  it('shows empty messages when there are no conditions or visible keys', async () => {
    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Subsumed', Visible: false }]}
        conditions={[]}
        visibleConditions={[]}
        styles={EMPTY_SERIES_STYLES}
        onChange={vi.fn()}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();

    await expect.element(page.getByText('No conditions available.')).toBeInTheDocument();
    await expect.element(page.getByText('No keys available.')).toBeInTheDocument();
  });

  it('switches the active key from the key selector', async () => {
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
    await page.getByRole('combobox', { name: 'Select key' }).click();
    await page.getByRole('option', { name: 'Kicking', exact: true }).click();

    await expect.element(page.getByRole('combobox', { name: 'Shape for Kicking' })).toBeInTheDocument();
  });

  it('sets a key shape from the shape selector', async () => {
    const onChange = vi.fn();

    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={EMPTY_SERIES_STYLES}
        onChange={onChange}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await page.getByRole('combobox', { name: 'Shape for Hitting' }).click();
    await page.getByRole('option', { name: 'triangle', exact: true }).click();

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_SERIES_STYLES,
      KeyStyles: { Hitting: { shape: 'triangle' } },
    });
  });

  it('sets a per-condition shape from the condition shape selector', async () => {
    const onChange = vi.fn();

    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={EMPTY_SERIES_STYLES}
        onChange={onChange}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await page.getByRole('combobox', { name: 'Shape in Baseline for Hitting' }).click();
    await page.getByRole('option', { name: 'diamond', exact: true }).click();

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_SERIES_STYLES,
      KeyStyles: { Hitting: { shapes: { Baseline: 'diamond' } } },
    });
  });

  it('clears a per-condition shape back to Default', async () => {
    const onChange = vi.fn();

    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={{ ...EMPTY_SERIES_STYLES, KeyStyles: { Hitting: { shapes: { Baseline: 'diamond' } } } }}
        onChange={onChange}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await page.getByRole('combobox', { name: 'Shape in Baseline for Hitting' }).click();
    await page.getByRole('option', { name: /^Default/ }).click();

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_SERIES_STYLES,
      KeyStyles: { Hitting: { shapes: {} } },
    });
  });

  it('clears a key shape back to Default', async () => {
    const onChange = vi.fn();

    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={styled}
        onChange={onChange}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await page.getByRole('combobox', { name: 'Shape for Hitting' }).click();
    await page.getByRole('option', { name: 'Default (circle)', exact: true }).click();

    expect(onChange).toHaveBeenCalledWith({
      ...styled,
      KeyStyles: { Hitting: { shape: undefined } },
    });
  });

  it('sets a per-condition marker fill to Hidden', async () => {
    const onChange = vi.fn();

    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={EMPTY_SERIES_STYLES}
        onChange={onChange}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await page.getByRole('combobox', { name: 'Marker fill for Hitting in Baseline' }).click();
    await page.getByRole('option', { name: 'Hidden', exact: true }).click();

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_SERIES_STYLES,
      KeyStyles: { Hitting: { fillColors: { Baseline: TRANSPARENT_COLOR } } },
    });
  });

  it('sets a per-condition marker fill from the palette', async () => {
    const onChange = vi.fn();
    const [, paletteColor] = SERIES_COLOR_PALETTE;

    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={EMPTY_SERIES_STYLES}
        onChange={onChange}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await page.getByRole('combobox', { name: 'Marker fill for Hitting in Baseline' }).click();
    await page.getByRole('option', { name: paletteColor, exact: true }).click();

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_SERIES_STYLES,
      KeyStyles: { Hitting: { fillColors: { Baseline: paletteColor } } },
    });
  });

  it('clears a per-condition marker fill back to Default', async () => {
    const onChange = vi.fn();

    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={{ ...styled, KeyStyles: { Hitting: { fillColors: { Baseline: '#000000' } } } }}
        onChange={onChange}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await page.getByRole('combobox', { name: 'Marker fill for Hitting in Baseline' }).click();
    await page.getByRole('option', { name: 'Default', exact: true }).click();

    expect(onChange).toHaveBeenCalledWith({
      ...styled,
      KeyStyles: { Hitting: { fillColors: {} } },
    });
  });

  it('sets and clears a per-condition line colour', async () => {
    const onChange = vi.fn();

    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={{ ...styled, KeyStyles: { Hitting: { lineColors: { Baseline: '#000000' } } } }}
        onChange={onChange}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await page.getByRole('combobox', { name: 'Line color for Hitting in Baseline' }).click();
    await page.getByRole('option', { name: 'Hidden', exact: true }).click();

    expect(onChange).toHaveBeenLastCalledWith({
      ...styled,
      KeyStyles: { Hitting: { lineColors: { Baseline: TRANSPARENT_COLOR } } },
    });

    await page.getByRole('combobox', { name: 'Line color for Hitting in Baseline' }).click();
    await page.getByRole('option', { name: 'Default', exact: true }).click();

    expect(onChange).toHaveBeenLastCalledWith({
      ...styled,
      KeyStyles: { Hitting: { lineColors: {} } },
    });
  });

  it('clears a condition fill back to Default', async () => {
    const onChange = vi.fn();

    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={styled}
        onChange={onChange}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await page.getByRole('combobox', { name: 'Marker fill for Baseline' }).click();
    await page.getByRole('option', { name: 'Default', exact: true }).click();

    expect(onChange).toHaveBeenCalledWith({ ...styled, ConditionStyles: {} });
  });

  it('sets a condition fill from the palette', async () => {
    const onChange = vi.fn();

    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={EMPTY_SERIES_STYLES}
        onChange={onChange}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await page.getByRole('combobox', { name: 'Marker fill for Baseline' }).click();
    await page.getByRole('option', { name: '#000000', exact: true }).click();

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_SERIES_STYLES,
      ConditionStyles: { Baseline: { color: '#000000' } },
    });
  });

  it('closes the dialog from Done', async () => {
    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={EMPTY_SERIES_STYLES}
        onChange={vi.fn()}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await page.getByRole('button', { name: 'Done' }).click();

    await expect.element(page.getByRole('heading', { name: 'Series Styles' })).not.toBeInTheDocument();
  });

  it('shows a hidden marker fill and sets a line colour from empty styles', async () => {
    const onChange = vi.fn();

    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={['Baseline']}
        styles={{ ...EMPTY_SERIES_STYLES, KeyStyles: { Hitting: { fillColors: { Baseline: TRANSPARENT_COLOR } } } }}
        onChange={onChange}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();
    await expect
      .element(page.getByRole('combobox', { name: 'Marker fill for Hitting in Baseline' }))
      .toHaveTextContent('Hidden');

    await page.getByRole('combobox', { name: 'Line color for Hitting in Baseline' }).click();
    await page.getByRole('option', { name: '#000000', exact: true }).click();

    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_SERIES_STYLES,
      KeyStyles: { Hitting: { fillColors: { Baseline: TRANSPARENT_COLOR }, lineColors: { Baseline: '#000000' } } },
    });
  });

  it('falls back to the condition position when the condition is not visible', async () => {
    await render(
      <SeriesStylesDialog
        keys={[{ KeyDescription: 'Hitting', Visible: true }]}
        conditions={['Baseline']}
        visibleConditions={[]}
        styles={EMPTY_SERIES_STYLES}
        onChange={vi.fn()}
      />,
    );

    await page.getByRole('button', { name: 'Edit Series Styles' }).click();

    await expect.element(page.getByText('Marker Fill (Baseline)').first()).toBeInTheDocument();
  });
});
