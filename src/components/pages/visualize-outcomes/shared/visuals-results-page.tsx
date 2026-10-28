import { type ComponentProps, type ComponentType, type ReactNode, useRef } from 'react';
import type RateFigureVisualization from '@/components/pages/visualize-outcomes/rate/rate-figure';
import { SavedSessionResult } from '@/lib/dtos/session-results';
import { KeySet } from '@/types/keyset';
import { saveChartImage } from '@/components/pages/visualize-outcomes/shared/chart-export';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VisualsMenubar } from '@/components/pages/visualize-outcomes/shared/visuals-menubar';
import { useVisualsSettings } from '@/components/pages/visualize-outcomes/shared/use-visuals-settings';
import { getUniqueSessionConditions } from '@/lib/graphing/session-filters';
import { SessionTerminationOptionsType } from '@/types/terminations';
import { ToggleDisplayKey } from '@/types/visuals';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import {
  filteredSessionScoringOptions,
  ScheduleMappingOptions,
  ScoringOptionsMapType,
} from '@/types/schedules';

export type VisualsFigureProps = ComponentProps<typeof RateFigureVisualization>;

/** Settings that differ between the rate and proportion pages */
export type VisualsPageConfig = {
  page: 'rate' | 'proportion';
  /** Plot label for per-plot storage (titles, labels, legend, connected spans) */
  plot: 'Rate' | 'Proportion';
  /** Cache scope for hidden keys and schedule */
  prefsType: 'Rate' | 'Duration';
  title: string;
  /** Whether scoring options (not just filters) are offered in the timer dropdown */
  includeScoringInSchedule: boolean;
  Figure: ComponentType<VisualsFigureProps>;
};

export type VisualsResultsPageProps = {
  Group: string;
  Individual: string;
  Evaluation: string;
  Conditions: string[];
  ResultsFiltered: SavedSessionResult[];
  DynamicKeySet: KeySet;
  TimerMapping: ScoringOptionsMapType;
  ShowKeys: ToggleDisplayKey[];
  MinX: number;
  MaxX: number;
  Settings: ApplicationSettingsTypes;
};

type Props = VisualsResultsPageProps & {
  config: VisualsPageConfig;
  actions: ReactNode;
  description: ReactNode;
};

/**
 * Shared results page for rate and proportion visualizations. Settings live in one reducer and each page supplies its config.
 */
export function VisualsResultsPage({
  config,
  actions,
  description,
  Group,
  Individual,
  Evaluation,
  Conditions,
  ResultsFiltered,
  DynamicKeySet,
  TimerMapping,
  ShowKeys,
  MinX,
  MaxX,
  Settings,
}: Props) {
  const [settings, dispatch] = useVisualsSettings({
    group: Group,
    individual: Individual,
    evaluation: Evaluation,
    plot: config.plot,
    prefsType: config.prefsType,
    keys: ShowKeys,
    conditions: Conditions,
    defaultSchedule: TimerMapping,
  });
  const figureRef = useRef<HTMLDivElement>(null);

  // Matches the legend order (first appearance in results), so dialog rows and default colours line up with the chart
  const legendConditionOrder = getUniqueSessionConditions(ResultsFiltered);
  const styleConditions = [...legendConditionOrder, ...Conditions.filter((c) => !legendConditionOrder.includes(c))];

  const onScheduleChange = (value: SessionTerminationOptionsType) => {
    const selectedOptionFixed = ScheduleMappingOptions.find((option) => option.value === value);

    if (selectedOptionFixed) {
      dispatch({ type: 'scheduleChanged', schedule: selectedOptionFixed });
    }

    const specialKeyOption = filteredSessionScoringOptions(Settings, DynamicKeySet, false, true).find(
      (option) => option.value === value,
    );

    if (specialKeyOption) {
      dispatch({
        type: 'scheduleChanged',
        schedule: { value: specialKeyOption.value, label: specialKeyOption.label },
      });
    }
  };

  const { Figure } = config;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row justify-between">
        <div className="flex flex-col gap-1.5 grow">
          <CardTitle>{config.title}</CardTitle>
          <CardDescription>Options for Visualizing Data Provided Below</CardDescription>
        </div>

        <div className="flex flex-row gap-2">{actions}</div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="w-full flex flex-row justify-between">
          <VisualsMenubar
            page={config.page}
            settings={settings}
            dispatch={dispatch}
            styleConditions={styleConditions}
            visibleStyleConditions={styleConditions.filter((c) =>
              settings.conditions.some((f) => f.Condition === c && f.Visible),
            )}
            onSaveImage={(format) => saveChartImage(figureRef.current, format, `${config.page}.${format}`)}
          />

          <div className="flex flex-row gap-2">
            <div className="flex flex-row items-center gap-2 w-fit">
              <p>Timer to Reference:</p>
              <Select value={settings.schedule.value} onValueChange={onScheduleChange}>
                <SelectTrigger className="w-fit">
                  <SelectValue placeholder="Timer to Reference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {filteredSessionScoringOptions(
                      Settings,
                      DynamicKeySet,
                      true,
                      config.includeScoringInSchedule,
                    ).map((option) => (
                      <SelectItem key={option.value} value={option.value as SessionTerminationOptionsType}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {settings.showDescription ? <p>{description}</p> : <div className="h-[25px]" />}

        {DynamicKeySet && (
          <Figure
            FilteredSessions={ResultsFiltered.filter((result) => {
              const conditionMatch = settings.conditions.find((c) => c.Condition === result.SessionSettings.Condition);
              return conditionMatch ? conditionMatch.Visible : true;
            })}
            ScheduleOption={settings.schedule.value}
            KeySetFull={settings.keys}
            DynamicKeySet={DynamicKeySet}
            Group={Group}
            Individual={Individual}
            Evaluation={Evaluation}
            FigureTextSize={settings.figureTextSize}
            ConnectSpans={settings.connectSpans}
            ShowTitle={settings.showTitle}
            ShowTooltip={settings.showTooltip}
            ShowConditionLegend={settings.showConditionLegend}
            LegendSettings={settings.legendSettings}
            FigureLabels={settings.figureLabels}
            MinX={MinX}
            MaxX={MaxX}
            SeriesStyles={settings.seriesStyles}
            divRef={figureRef}
          />
        )}
      </CardContent>
    </Card>
  );
}
