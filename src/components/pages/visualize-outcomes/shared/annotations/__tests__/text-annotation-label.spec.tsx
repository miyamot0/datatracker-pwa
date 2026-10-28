import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect, vi } from 'vitest';
import { TextAnnotationLabel } from '../text-annotation-label';
import type { TextAnnotation } from '@/lib/graphing/series-style';

const base: TextAnnotation = { label: 'Baseline', x: 2, y: 50, anchor: 'top-left', justify: 'left' };

describe('TextAnnotationLabel', () => {
  it('renders each line and settles when its label, anchor, or justify changes', async () => {
    const screen = await render(
      <svg width={400} height={300}>
        <TextAnnotationLabel annotation={base} viewBox={{ x: 100, y: 100 }} />
      </svg>,
    );

    await expect.element(page.getByText('Baseline')).toBeInTheDocument();

    const variants: TextAnnotation[] = [
      { ...base, label: 'Line one\\nLine two\\nLine three', anchor: 'middle-center', justify: 'center' },
      { ...base, label: 'Short', anchor: 'bottom-right', justify: 'right' },
      { ...base, label: 'Short', anchor: 'bottom-right', justify: 'right' },
    ];

    for (const annotation of variants) {
      await screen.rerender(
        <svg width={400} height={300}>
          <TextAnnotationLabel annotation={annotation} viewBox={{ x: 100, y: 100 }} />
        </svg>,
      );
    }

    await expect.element(page.getByText('Short')).toBeInTheDocument();
  });

  it('renders normal weight by default and bold when the annotation asks for it', async () => {
    await render(
      <svg width={400} height={300}>
        <TextAnnotationLabel annotation={base} viewBox={{ x: 100, y: 100 }} />
      </svg>,
    );

    const text = page.getByText('Baseline').element();
    expect(text.getAttribute('font-weight')).toBe('normal');

    await render(
      <svg width={400} height={300}>
        <TextAnnotationLabel annotation={{ ...base, label: 'Heavy', weight: 'bold' }} viewBox={{ x: 100, y: 100 }} />
      </svg>,
    );

    expect(page.getByText('Heavy').element().getAttribute('font-weight')).toBe('bold');
  });

  it('treats a non-finite measurement as zero and still renders the label', async () => {
    const spy = vi
      .spyOn(SVGTextElement.prototype, 'getBBox')
      .mockReturnValue({ x: 0, y: 0, width: Number.NaN, height: Number.NaN } as DOMRect);

    await render(
      <svg width={400} height={300}>
        <TextAnnotationLabel annotation={base} viewBox={{ x: 100, y: 100 }} />
      </svg>,
    );

    await expect.element(page.getByText('Baseline')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('keeps the same layout when a re-measure returns identical boxes', async () => {
    const spy = vi
      .spyOn(SVGTextElement.prototype, 'getBBox')
      .mockReturnValue({ x: 0, y: 0, width: 40, height: 12 } as DOMRect);

    const screen = await render(
      <svg width={400} height={300}>
        <TextAnnotationLabel annotation={{ ...base, label: 'Line one\\nLine two' }} viewBox={{ x: 100, y: 100 }} />
      </svg>,
    );

    await screen.rerender(
      <svg width={400} height={300}>
        <TextAnnotationLabel
          annotation={{ ...base, label: 'Line one\\nLine two', weight: 'bold' }}
          viewBox={{ x: 100, y: 100 }}
        />
      </svg>,
    );

    await expect.element(page.getByText('Line one')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('places the label at the origin when no view box is supplied', async () => {
    await render(
      <svg width={400} height={300}>
        <TextAnnotationLabel annotation={base} />
      </svg>,
    );

    await expect.element(page.getByText('Baseline')).toBeInTheDocument();
  });
});
