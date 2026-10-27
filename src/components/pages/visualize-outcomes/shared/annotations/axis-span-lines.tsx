import { usePlotArea, useXAxisTicks, useYAxisTicks } from 'recharts';

type AxisSpanLinesProps = {
  stroke?: string;
  strokeWidth?: number;
};

export function AxisSpanLines({ stroke = 'black', strokeWidth = 1 }: AxisSpanLinesProps) {
  const plotArea = usePlotArea();
  const xTicks = useXAxisTicks();
  const yTicks = useYAxisTicks();

  if (!plotArea) {
    return null;
  }

  const plotLeft = plotArea.x;
  const plotRight = plotArea.x + plotArea.width;
  const plotTop = plotArea.y;
  const plotBottom = plotArea.y + plotArea.height;

  // Recharts registers no tick scale until a series is plotted, so an empty chart falls back to the plot edges.
  const xCoordinates = (xTicks ?? []).map((tick) => tick.coordinate);
  const yCoordinates = (yTicks ?? []).map((tick) => tick.coordinate);

  const xStart = xCoordinates.length ? Math.min(...xCoordinates) : plotLeft;
  const xEnd = xCoordinates.length ? Math.max(...xCoordinates) : plotRight;
  const yStart = yCoordinates.length ? Math.max(...yCoordinates) : plotBottom;
  const yEnd = yCoordinates.length ? Math.min(...yCoordinates) : plotTop;

  return (
    <g className="axis-span-lines">
      <line
        className="axis-span-line axis-span-line-x"
        x1={xStart}
        y1={plotBottom}
        x2={xEnd}
        y2={plotBottom}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <line
        className="axis-span-line axis-span-line-y"
        x1={plotLeft}
        y1={yStart}
        x2={plotLeft}
        y2={yEnd}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
    </g>
  );
}
