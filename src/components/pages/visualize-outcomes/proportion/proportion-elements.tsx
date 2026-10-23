import { cn } from '@/lib/utils';
import { FIGURE_TEXT_OPTIONS } from '@/types/accessibility';

type TooltipRow = Record<string, any>;

type ProportionTooltipProps = {
  active?: boolean;
  payload?: { payload: TooltipRow }[];
  figureTextSize?: string;
  visibleKeys: string[];
};

/**
 * Helper component for displaying proportion tooltip data
 */
function OutputDisplay({ row, keys }: { row: TooltipRow; keys: string[] }) {
  const pct_session = (data: any) => {
    return `${data.toFixed(2)}%`;
  };

  const get_seconds = (data: any) => {
    return `${((data * row.SessionTime) / 100).toFixed(2)}s`;
  };

  return (
    <div className="flex flex-col text-sm">
      {keys.map((key) => {
        const cleaned_up_tag = key.replace(row.Condition, '').replace('-', '');

        const value = row[key];
        const bout_n = row[`${key}-Bouts`];
        const bout_ave = row[`${key}-Bout-Ave`];

        return (
          <div key={key} className="flex flex-col mb-1">
            <div className="flex flex-row justify-between text-sm">
              <span className="font-semibold mr-2">{`${cleaned_up_tag} Total`}</span>
              <p className="text-sm">{get_seconds(value * 60)}</p>
            </div>
            <div className="flex flex-row justify-between text-sm">
              <span className="font-semibold mr-2">{`${cleaned_up_tag} %`}</span>
              <p className="text-sm">{pct_session(value)}</p>
            </div>
            <div className="flex flex-row justify-between text-sm">
              <span className="font-semibold mr-2">{`${cleaned_up_tag} Bouts`}</span>
              <p className="text-sm">{bout_n !== undefined ? `${bout_n}` : 'N/A'}</p>
            </div>
            <div className="flex flex-row justify-between text-sm">
              <span className="font-semibold mr-2">{`${cleaned_up_tag} Ave`}</span>
              <p className="text-sm">{bout_ave !== undefined && bout_ave !== 0 ? `${bout_ave.toFixed(2)}s` : 'N/A'}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Proportion-specific tooltip component
 *
 * Values are read from the hovered session row, because the raw recharts payload varies with the hover target
 * (line, scatter, or x-axis entries).
 */
export function ProportionTooltip({ active, payload, figureTextSize, visibleKeys }: ProportionTooltipProps) {
  if (active && payload && payload.length) {
    const main_payload = payload[0].payload;
    const { Condition } = main_payload;

    const plotted_keys = visibleKeys.filter((key) => Number.isFinite(main_payload[key]));

    return (
      <div
        className={cn('bg-primary-foreground p-4 border rounded', {
          'text-xl': figureTextSize == FIGURE_TEXT_OPTIONS[1].value,
          'text-2xl': figureTextSize == FIGURE_TEXT_OPTIONS[2].value,
        })}
      >
        <p className="font-bold">{`Session #${main_payload.session} (${Condition})`}</p>
        <p className="font-semibold mb-2">{`Session Time: ${main_payload.SessionTime.toPrecision(2)} min`}</p>

        <OutputDisplay row={main_payload} keys={plotted_keys} />
      </div>
    );
  }

  return null;
}
