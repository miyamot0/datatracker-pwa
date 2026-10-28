import { SavedSessionResult } from '@/lib/dtos/session-results';
import type { RefObject } from 'react';
import { type FigureVisualSizing } from '@/types/accessibility';
import { useNavigate } from '@tanstack/react-router';
import { ExpandedKeySetInstance, KeySet } from '@/types/keyset';
import { generateTicks, createChartLegends, createNavigationHandler } from '@/lib/graphing/chart-setup';
import { prepareRateDataUniversal } from '@/lib/graphing/data-preparation';
import { SessionTerminationOptionsType } from '@/types/terminations';
import { BaseChart } from '@/components/pages/visualize-outcomes/shared/ui/base-chart';
import { RateTooltip } from './rate-elements';
import { processMultipleSessionDataWithKeys } from '@/lib/calculations';
import { convertLegacyTimerType } from '@/lib/calculations/calculation-helpers';
import { EMPTY_SERIES_STYLES, type SeriesStyles } from '@/lib/graphing/series-style';
import {
  EMPTY_FIGURE_LABEL_SETTINGS,
  FIGURE_LABEL_DEFAULTS,
  resolveFigureLabels,
  type FigureLabelSettings,
} from '@/lib/graphing/figure-labels';
import { DEFAULT_LEGEND_SETTINGS, type LegendSettings } from '@/lib/graphing/legend-settings';

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
  FilteredSessions: SavedSessionResult[];
  ScheduleOption: SessionTerminationOptionsType;
  KeySetFull: ExpandedKeySetInstance[];
  DynamicKeySet: KeySet;
  FigureTextSize: FigureVisualSizing;
  ConnectSpans: boolean;
  MinX: number;
  MaxX: number;
  SeriesStyles?: SeriesStyles;
  ShowTitle?: boolean;
  ShowTooltip?: boolean;
  ShowConditionLegend?: boolean;
  LegendSettings?: LegendSettings;
  FigureLabels?: FigureLabelSettings;
  divRef: RefObject<HTMLDivElement | null>;
};

export default function RateFigureVisualization({
  Group,
  Individual,
  Evaluation,
  FilteredSessions,
  ScheduleOption,
  KeySetFull,
  DynamicKeySet,
  FigureTextSize,
  ConnectSpans,
  MinX,
  MaxX,
  SeriesStyles = EMPTY_SERIES_STYLES,
  ShowTitle = true,
  ShowTooltip = true,
  ShowConditionLegend = true,
  LegendSettings = DEFAULT_LEGEND_SETTINGS,
  FigureLabels = EMPTY_FIGURE_LABEL_SETTINGS,
  divRef,
}: Props) {
  const navigate = useNavigate({
    from: `/session/$group/$individual/$evaluation/rate`,
  });

  const labels = resolveFigureLabels(FigureLabels, FIGURE_LABEL_DEFAULTS.rate);
  const x_ticks = generateTicks(MaxX, MinX);
  const legends = createChartLegends(FilteredSessions, KeySetFull, SeriesStyles);
  const onNavigate = createNavigationHandler(navigate, Group, Individual, Evaluation);

  const yAxisConfig = {
    min: 0,
    label: labels.yAxis,
    padding: { bottom: 10 },
  };

  const frequencyRates = processMultipleSessionDataWithKeys(
    FilteredSessions,
    DynamicKeySet,
    convertLegacyTimerType(ScheduleOption, DynamicKeySet),
    'CHART_ALL',
    {
      frequencyKeys: [],
      durationKeys: DynamicKeySet.DurationKeys,
      derivedKeys: [],
    },
  );

  const { preparedData } = prepareRateDataUniversal(frequencyRates);

  return (
    <div className="flex flex-col gap-4 w-full nuke-view-transition">
      <BaseChart
        title={labels.title}
        preparedData={preparedData}
        filteredSessions={FilteredSessions}
        keySetFull={KeySetFull}
        seriesStyles={SeriesStyles}
        textPage="rate"
        showTitle={ShowTitle}
        showTooltip={ShowTooltip}
        showConditionLegend={ShowConditionLegend}
        legendSettings={LegendSettings}
        xAxisLabel={labels.xAxis}
        figureTextSize={FigureTextSize}
        connectSpans={ConnectSpans}
        minX={MinX}
        maxX={MaxX}
        xTicks={x_ticks}
        legends={legends}
        yAxisConfig={yAxisConfig}
        customTooltip={RateTooltip}
        onNavigate={onNavigate}
        divRef={divRef}
      />
    </div>
  );
}
