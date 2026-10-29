type ChartTitleProps = {
  title: string;
  fontPx: number;
  y: number;
};

/**
 * Chart title, horizontally centered in the chart area at a fixed vertical position
 */
export function ChartTitle({ title, fontPx, y }: ChartTitleProps) {
  return (
    <text x="50%" y={y} textAnchor="middle" dominantBaseline="central">
      <tspan className="font-bold" style={{ fontSize: `${fontPx}px` }}>
        {title}
      </tspan>
    </text>
  );
}
