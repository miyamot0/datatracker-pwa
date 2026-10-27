import { usePlotArea, useXAxisScale, useYAxisScale } from 'recharts';
import type { TextAnnotation } from '@/lib/graphing/series-style';
import { TextAnnotationLabel } from './text-annotation-label';

type Props = {
  annotations: TextAnnotation[];
};

/**
 * Draws text annotations at their data coordinates using the chart's axis scales.
 *
 * Rendered as a plain chart child rather than a Recharts ReferenceDot, so annotations never register with the
 * chart's reference-element store (which re-dispatches on every render and caused an update-depth loop).
 * Annotations outside the plot area are not drawn.
 */
export function TextAnnotationsLayer({ annotations }: Props) {
  const xScale = useXAxisScale();
  const yScale = useYAxisScale();
  const plotArea = usePlotArea();

  if (!xScale || !yScale || !plotArea) {
    return null;
  }

  const left = plotArea.x;
  const right = plotArea.x + plotArea.width;
  const top = plotArea.y;
  const bottom = plotArea.y + plotArea.height;

  return (
    <g>
      {annotations.map((annotation, index) => {
        const x = xScale(annotation.x);
        const y = yScale(annotation.y);

        if (x === undefined || y === undefined || x < left || x > right || y < top || y > bottom) {
          return null;
        }

        return <TextAnnotationLabel key={`text-annotation-${index}`} annotation={annotation} viewBox={{ x, y }} />;
      })}
    </g>
  );
}
