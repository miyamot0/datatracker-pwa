import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect } from 'vitest';
import { TextAnnotationsDialog } from '../text-annotations-dialog';
import { EMPTY_SERIES_STYLES, type SeriesStyles } from '@/lib/graphing/series-style';

const withTexts: SeriesStyles = {
  ...EMPTY_SERIES_STYLES,
  text_annotations: [
    { label: 'Baseline', x: 3, y: 40, anchor: 'top-left', justify: 'left' },
    { label: 'Line one\\nLine two', x: 7.5, y: 60, anchor: 'bottom-right', justify: 'center' },
  ],
};

describe('TextAnnotationsDialog', () => {
  it('shows an empty state when no text is saved', async () => {
    await render(<TextAnnotationsDialog styles={EMPTY_SERIES_STYLES} onChange={vi.fn()} />);

    await page.getByRole('button', { name: 'Edit Text Annotations' }).click();

    await expect.element(page.getByText('No text annotations.')).toBeInTheDocument();
  });

  it('lists each saved text on its own row with a delete button', async () => {
    await render(<TextAnnotationsDialog styles={withTexts} onChange={vi.fn()} />);

    await page.getByRole('button', { name: 'Edit Text Annotations' }).click();

    await expect.element(page.getByLabelText('Label for text 1')).toHaveValue('Baseline');
    await expect.element(page.getByLabelText('X position for text 1')).toHaveValue(3);
    await expect.element(page.getByLabelText('Y position for text 2')).toHaveValue(60);
    await expect.element(page.getByRole('button', { name: 'Delete text 1' })).toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Delete text 2' })).toBeInTheDocument();
  });

  it('deletes only the chosen text and keeps the rest of the styles', async () => {
    const onChange = vi.fn();
    await render(<TextAnnotationsDialog styles={withTexts} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Text Annotations' }).click();
    await page.getByRole('button', { name: 'Delete text 1' }).click();

    expect(onChange).toHaveBeenLastCalledWith({
      ...withTexts,
      text_annotations: [{ ...withTexts.text_annotations[1], weight: 'normal' }],
    });
  });

  it('adds a text that is saved once its label and both coordinates are entered', async () => {
    const onChange = vi.fn();
    await render(<TextAnnotationsDialog styles={EMPTY_SERIES_STYLES} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Text Annotations' }).click();
    await page.getByRole('button', { name: 'Add Text' }).click();

    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_SERIES_STYLES, text_annotations: [] });
    await expect
      .element(page.getByText('Enter a label, and numbers for X and Y, to save this text.'))
      .toBeInTheDocument();

    await page.getByLabelText('Label for text 1').fill('Note');
    await page.getByLabelText('X position for text 1').fill('2');
    await page.getByLabelText('Y position for text 1').fill('50');

    expect(onChange).toHaveBeenLastCalledWith({
      ...EMPTY_SERIES_STYLES,
      text_annotations: [{ label: 'Note', x: 2, y: 50, anchor: 'middle-left', justify: 'left', weight: 'normal' }],
    });
  });

  it('saves a bold weight when the user picks Bold for a text', async () => {
    const onChange = vi.fn();
    await render(<TextAnnotationsDialog styles={withTexts} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Text Annotations' }).click();
    await expect.element(page.getByLabelText('Weight for text 1')).toHaveTextContent('Normal');

    await page.getByLabelText('Weight for text 1').click();
    await page.getByRole('option', { name: 'Bold' }).click();

    expect(onChange).toHaveBeenLastCalledWith({
      ...withTexts,
      text_annotations: [
        { ...withTexts.text_annotations[0], weight: 'bold' },
        { ...withTexts.text_annotations[1], weight: 'normal' },
      ],
    });
  });

  it('does not save a text without an X position', async () => {
    const onChange = vi.fn();
    await render(<TextAnnotationsDialog styles={EMPTY_SERIES_STYLES} onChange={onChange} />);

    await page.getByRole('button', { name: 'Edit Text Annotations' }).click();
    await page.getByRole('button', { name: 'Add Text' }).click();
    await page.getByLabelText('Label for text 1').fill('Note');
    await page.getByLabelText('Y position for text 1').fill('50');

    expect(onChange).toHaveBeenLastCalledWith({ ...EMPTY_SERIES_STYLES, text_annotations: [] });
  });
});
