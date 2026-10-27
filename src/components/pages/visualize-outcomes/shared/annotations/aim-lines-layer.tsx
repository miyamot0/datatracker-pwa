import { usePlotArea, useXAxisScale, useYAxisScale } from 'recharts';
import type { AimLine } from '@/lib/graphing/series-style';
import { PHASE_LINE_DASH_ARRAY } from '@/lib/graphing/series-style';

type Props = {
  aimLines: AimLine[];
};

/**
 * Draws aim lines (horizontal spans) at their data coordinates using the chart's axis scales.
 *
 * Rendered as a plain chart child rather than a Recharts ReferenceLine, so aim lines never register with the
 * chart's reference-element store. Aim lines outside the plot area are clipped to its boundaries.
 */
export function AimLinesLayer({ aimLines }: Props) {
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
      {aimLines.map((aimLine, index) => {
        const x1Pixel = xScale(aimLine.x1);
        const x2Pixel = xScale(aimLine.x2);
        const yPixel = yScale(aimLine.y);

        if (x1Pixel === undefined || x2Pixel === undefined || yPixel === undefined) {
          return null;
        }

        // Clip to plot area boundaries
        const startX = Math.max(Math.min(x1Pixel, x2Pixel), left);
        const endX = Math.min(Math.max(x1Pixel, x2Pixel), right);

        // Skip if the line is completely outside the plot area
        if (startX > right || endX < left || yPixel < top || yPixel > bottom) {
          return null;
        }

        return (
          <line
            key={`aim-line-${index}`}
            x1={startX}
            y1={yPixel}
            x2={endX}
            y2={yPixel}
            stroke={aimLine.color}
            strokeWidth={1}
            strokeDasharray={PHASE_LINE_DASH_ARRAY[aimLine.lineType]}
          />
        );
      })}
    </g>
  );
}
