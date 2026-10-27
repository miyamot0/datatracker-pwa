/* eslint-disable @typescript-eslint/no-explicit-any */
import { Symbols } from 'recharts';

/**
 * Renders legend entries directly so condition markers always get a black outline and black label,
 * keeping white fills visible. Key entries keep their recharts symbol.
 */
export function ChartLegendContent({ payload }: { payload?: any[] }) {
  return (
    <ul className="recharts-default-legend" style={{ margin: 0, padding: 0, textAlign: 'center' }}>
      {payload?.map((entry) => (
        <li
          key={String(entry.value)}
          className="recharts-legend-item"
          style={{ display: 'inline-block', marginRight: 10, whiteSpace: 'nowrap' }}
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 32 32"
            aria-label={`${entry.value} legend icon`}
            style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }}
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
