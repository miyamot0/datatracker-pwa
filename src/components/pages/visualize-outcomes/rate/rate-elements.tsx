import { cn } from '@/lib/utils';
import { FIGURE_TEXT_OPTIONS } from '@/types/accessibility';

type RateTooltipProps = {
  active?: boolean;
  payload?: { payload: Record<string, any> }[];
  figureTextSize?: string;
  visibleKeys: string[];
  hiddenKeysByCondition?: Record<string, string[]>;
};

/**
 * Rate-specific tooltip component
 *
 * Values are read from the hovered session row, because the raw recharts payload varies with the hover target
 * (line, scatter, or x-axis entries).
 *
 * @param active - Indicates if the tooltip is active (visible)
 * @param payload - The data payload provided by the chart for the hovered point
 * @param figureTextSize - The current text size setting for the figure, used to adjust tooltip text size
 * @param visibleKeys - Descriptions of the currently visible keys, in display order
 * @param hiddenKeysByCondition - Keys hidden within each condition, which are omitted from the tooltip
 * @returns A JSX element representing the tooltip content, or null if not active
 */
export function RateTooltip({
  active,
  payload,
  figureTextSize,
  visibleKeys,
  hiddenKeysByCondition = {},
}: RateTooltipProps) {
  if (active && payload && payload.length) {
    const main_payload = payload[0].payload;
    const { Condition } = main_payload;

    const hidden_keys = hiddenKeysByCondition[Condition] ?? [];
    const plotted_keys = visibleKeys.filter((key) => !hidden_keys.includes(key) && Number.isFinite(main_payload[key]));

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
          {plotted_keys.map((key) => {
            const cleaned_up_tag = key.replace(Condition, '').replace('-', '');

            const rate_per_min = main_payload[key];
            const total_count = rate_per_min * main_payload.SessionTime;

            return (
              <div key={key} className="flex flex-col mb-1">
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
