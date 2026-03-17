import { cn } from '@/lib/utils';
import { FIGURE_TEXT_OPTIONS } from '@/types/accessibility';

/**
 * Helper component for displaying proportion tooltip data
 */
function OutputDisplay({ payloads }: { payloads: any[] }) {
  const main_payload = payloads[0].payload;

  const pct_session = (data: any) => {
    return `${data.toFixed(2)}%`;
  };

  const get_seconds = (data: any) => {
    return `${((data * main_payload.SessionTime) / 100).toFixed(2)}s`;
  };

  return (
    <div className="flex flex-col text-sm">
      {payloads.map((entry, index) => {
        const cleaned_up_tag = entry.dataKey.toString().replace(payloads[0].payload.Condition, '').replace('-', '');

        const bout_n = entry.payload[`${entry.name}-Bouts`];
        const bout_ave = entry.payload[`${entry.name}-Bout-Ave`];

        return (
          <div key={index} className="flex flex-col mb-1">
            <div className="flex flex-row justify-between text-sm">
              <span className="font-semibold mr-2">{`${cleaned_up_tag} Total`}</span>
              <p className="text-sm">{get_seconds(entry.value)}</p>
            </div>
            <div className="flex flex-row justify-between text-sm">
              <span className="font-semibold mr-2">{`${cleaned_up_tag} %`}</span>
              <p className="text-sm">{pct_session(entry.value)}</p>
            </div>
            <div className="flex flex-row justify-between text-sm">
              <span className="font-semibold mr-2">{`${cleaned_up_tag} Bouts`}</span>
              <p className="text-sm">{bout_n !== undefined ? `${bout_n}` : 'N/A'}</p>
            </div>
            <div className="flex flex-row justify-between text-sm">
              <span className="font-semibold mr-2">{`${cleaned_up_tag} Ave`}</span>
              <p key={`item-${index}`} className="text-sm">
                {bout_ave !== undefined && bout_ave !== 0 ? `${bout_ave}s` : 'N/A'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Proportion-specific tooltip component
 */
export function ProportionTooltip({ active, payload, figureTextSize }: any) {
  if (active && payload && payload.length) {
    const main_payload = payload[0].payload;
    const { Condition } = main_payload;

    const relevant_payloads = payload.filter(
      (entry: any) => entry.payload.Condition === Condition && !entry.name.includes('-Points_'),
    );

    const relevant_payloads_unique = relevant_payloads
      .filter((entry: any, index: number, self: any[]) => {
        return index === self.findIndex((t) => t.dataKey === entry.dataKey);
      })
      .filter((entry: any) => !Number.isNaN(entry.value));

    return (
      <div
        className={cn('bg-primary-foreground p-4 border rounded', {
          'text-xl': figureTextSize == FIGURE_TEXT_OPTIONS[1].value,
          'text-2xl': figureTextSize == FIGURE_TEXT_OPTIONS[2].value,
        })}
      >
        <p className="font-bold">{`Session #${main_payload.session} (${Condition})`}</p>
        <p className="font-semibold mb-2">{`Session Time: ${(main_payload.SessionTime / 60).toPrecision(2)} min`}</p>

        <OutputDisplay payloads={relevant_payloads_unique} />
      </div>
    );
  }

  return null;
}
