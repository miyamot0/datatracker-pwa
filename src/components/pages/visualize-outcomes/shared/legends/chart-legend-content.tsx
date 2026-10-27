/* eslint-disable @typescript-eslint/no-explicit-any */
import { Symbols } from 'recharts';
import { type LegendLayout } from '@/lib/graphing/legend-settings';

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
            width={14}
            height={14}
            viewBox="0 0 32 32"
            aria-label={`${entry.value} legend icon`}
            style={{ display: 'inline-block', marginRight: 4 }}
          >
            {entry.kind === 'condition' ? (
              <Symbols
                type={'circle'}
                cx={16}
                cy={16}
                size={32}
                sizeType="diameter"
                fill={entry.color}
                stroke="black"
                strokeWidth={3}
              />
            ) : (
              <Symbols type={entry.type} cx={16} cy={16} size={32} sizeType="diameter" fill={entry.color} />
            )}
          </svg>
          <span className="recharts-legend-item-text" style={{ color: 'black' }}>
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
