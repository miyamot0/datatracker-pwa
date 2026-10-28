import React from 'react';

export type XAxisLabelViewBox = { x: number; y: number; width: number; height: number };

type XAxisLabelProps = {
  /** Provided by Recharts' Label `content` hook: the x-axis band */
  viewBox?: XAxisLabelViewBox;
  value: string;
  /** Distance in px between the bottom of the axis band and the text baseline */
  offset: number;
  style?: React.CSSProperties;
};

/**
 * X-axis title, horizontally centered and anchored to the bottom of the x-axis band
 */
export function XAxisLabel({ viewBox, value, offset, style }: XAxisLabelProps) {
  if (!viewBox) {
    return null;
  }

  const x = viewBox.x + viewBox.width / 2;
  const y = viewBox.y + viewBox.height - offset;

  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="text-after-edge" style={style}>
      {value}
    </text>
  );
}
