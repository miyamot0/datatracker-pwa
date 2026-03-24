import { cn } from '@/lib/utils';
import { FIGURE_TEXT_OPTIONS } from '@/types/accessibility';

/**
 * Rate-specific tooltip component
 *
 * @param active - Indicates if the tooltip is active (visible)
 * @param payload - The data payload provided by the chart for the hovered point
 * @param figureTextSize - The current text size setting for the figure, used to adjust tooltip text size
 * @returns A JSX element representing the tooltip content, or null if not active
 */
export function RateTooltip({ active, payload, figureTextSize }: any) {
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
        <p className="font-semibold mb-2">{`Session Time: ${main_payload.SessionTime.toPrecision(2)} min`}</p>

        <div className="flex flex-col ">
          {relevant_payloads_unique.map((entry: any, index: number) => {
            const cleaned_up_tag = entry.dataKey.toString().replace(payload[0].payload.Condition, '').replace('-', '');

            const rate_per_min = entry.value;
            const total_count = rate_per_min * main_payload.SessionTime;

            return (
              <div key={index} className="flex flex-col mb-1">
                <div className="flex flex-row justify-between">
                  <span className="font-semibold mr-2">{cleaned_up_tag} Count</span>
                  <p className="">{`${total_count.toFixed(2)}`}</p>
                </div>
                <div className="flex flex-row justify-between">
                  <span className="font-semibold mr-2">{cleaned_up_tag} Rate</span>
                  <p className="">{`${rate_per_min.toFixed(2)}/min`}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
