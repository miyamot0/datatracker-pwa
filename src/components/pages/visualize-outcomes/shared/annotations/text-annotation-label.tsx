import { useLayoutEffect, useRef, useState } from 'react';
import { splitTextAnnotationLines, TEXT_ANNOTATION_COLOR, type TextAnnotation } from '@/lib/graphing/series-style';

type Props = {
  annotation: TextAnnotation;
  /** Pixel position of the annotation's data coordinate, supplied by the Recharts label context */
  viewBox?: { x?: number; y?: number };
};

type Measurement = {
  widths: number[];
  lineHeight: number;
};

/** Fraction of the block that sits before the anchor point, per horizontal and vertical anchor and justify */
const HORIZONTAL_OFFSET = { left: 0, center: 0.5, right: 1 } as const;
const VERTICAL_OFFSET = { top: 0, middle: 0.5, bottom: 1 } as const;
const JUSTIFY_OFFSET = { left: 0, center: 0.5, right: 1 } as const;

/** Treats non-finite measurements (e.g., NaN from an unrendered element) as zero so they compare as stable */
function finiteOrZero(value: number | undefined) {
  return value !== undefined && Number.isFinite(value) ? value : 0;
}

function isSameMeasurement(a: Measurement, b: Measurement) {
  return (
    Object.is(a.lineHeight, b.lineHeight) &&
    a.widths.length === b.widths.length &&
    a.widths.every((width, index) => Object.is(width, b.widths[index]))
  );
}

/**
 * Draws a text annotation as SVG text, one tspan-style line per \n in its label.
 *
 * SVG text does not wrap, so each line is measured after rendering and placed so the block honours the anchor point
 * and the justification of the lines within it. Measuring runs before paint, so the first frame is already correct.
 */
export function TextAnnotationLabel({ annotation, viewBox }: Props) {
  const lines = splitTextAnnotationLines(annotation.label);
  const fontWeight = annotation.weight === 'bold' ? 'bold' : 'normal';
  const textRefs = useRef<(SVGTextElement | null)[]>([]);
  const [measurement, setMeasurement] = useState<Measurement>({ widths: [], lineHeight: 0 });

  useLayoutEffect(() => {
    const lineCount = splitTextAnnotationLines(annotation.label).length;
    const boxes = textRefs.current.slice(0, lineCount).map((element) => element?.getBBox());
    const next: Measurement = {
      widths: boxes.map((box) => finiteOrZero(box?.width)),
      lineHeight: Math.max(0, ...boxes.map((box) => finiteOrZero(box?.height))),
    };

    setMeasurement((previous) => (isSameMeasurement(previous, next) ? previous : next));
  }, [annotation.label, fontWeight]);

  const [vertical, horizontal] = annotation.anchor.split('-') as [
    keyof typeof VERTICAL_OFFSET,
    keyof typeof HORIZONTAL_OFFSET,
  ];

  const anchorX = viewBox?.x ?? 0;
  const anchorY = viewBox?.y ?? 0;
  const blockWidth = Math.max(0, ...measurement.widths);
  const blockHeight = measurement.lineHeight * lines.length;
  const blockLeft = anchorX - blockWidth * HORIZONTAL_OFFSET[horizontal];
  const blockTop = anchorY - blockHeight * VERTICAL_OFFSET[vertical];

  return (
    <g pointerEvents="none">
      {lines.map((line, index) => {
        const lineWidth = measurement.widths[index] ?? 0;

        return (
          <text
            key={`text-annotation-line-${index}`}
            ref={(element) => {
              textRefs.current[index] = element;
            }}
            x={blockLeft + (blockWidth - lineWidth) * JUSTIFY_OFFSET[annotation.justify]}
            y={blockTop + index * measurement.lineHeight}
            fill={TEXT_ANNOTATION_COLOR}
            dominantBaseline="hanging"
            fontWeight={fontWeight}
            style={{ whiteSpace: 'pre' }}
          >
            {line}
          </text>
        );
      })}
    </g>
  );
}
