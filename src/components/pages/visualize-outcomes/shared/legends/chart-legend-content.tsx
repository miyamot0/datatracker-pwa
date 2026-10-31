/* eslint-disable @typescript-eslint/no-explicit-any */
import { Symbols } from 'recharts';
import { type LegendLayout } from '@/lib/graphing/legend-settings';
import { ROTATED_SQUARE_LEGEND_AREA, ROTATED_SQUARE_SHAPE } from '@/lib/graphing/series-style';

// Recharts positions triangles by their centroid, which sits 8/√3 units below the box center at this legend size.
const TRIANGLE_LEGEND_CY = 16 + 8 / Math.sqrt(3);

type Props = {
  payload?: any[];
  layout?: LegendLayout;
  align?: 'center' | 'start';
};

/**
 * Renders legend entries directly so condition markers always get a black outline and black label,
 * keeping white fills visible. Key entries keep their recharts symbol.
 * Items run across in a row for the horizontal layout and down a column for the vertical layout.
 */
export function ChartLegendContent({ payload, layout = 'horizontal', align = 'center' }: Props) {
  const vertical = layout === 'vertical';

  return (
    <ul
      className="recharts-default-legend"
      style={{
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: vertical ? 'column' : 'row',
        flexWrap: vertical ? 'nowrap' : 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        alignItems: vertical && align === 'start' ? 'flex-start' : 'center',
        textAlign: align,
      }}
    >
      {payload?.map((entry) => (
        <li
          key={String(entry.value)}
          className="recharts-legend-item"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            marginRight: vertical ? 0 : 10,
            marginBottom: vertical ? 4 : 0,
            whiteSpace: 'nowrap',
          }}
        >
          <svg
            width={16}
            height={16}
            viewBox="0 0 32 32"
            aria-label={`${entry.value} legend icon`}
            style={{ display: 'inline-block', marginRight: 4, overflow: 'visible' }}
          >
            <Symbols
              type={entry.type}
              cx={16}
              cy={entry.type === 'triangle' ? TRIANGLE_LEGEND_CY : 16}
              {...(entry.type === ROTATED_SQUARE_SHAPE
                ? { size: ROTATED_SQUARE_LEGEND_AREA, sizeType: 'area' as const }
                : { size: 32, sizeType: 'diameter' as const })}
              fill={entry.color}
              shapeRendering="geometricPrecision"
              {...(entry.kind === 'condition' ? { stroke: 'black', strokeWidth: 4 } : {})}
            />
          </svg>
          <span className="recharts-legend-item-text" style={{ color: 'black' }}>
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
