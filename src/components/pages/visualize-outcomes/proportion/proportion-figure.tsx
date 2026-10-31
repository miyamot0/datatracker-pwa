import { SavedSessionResult } from '@/lib/dtos/session-results';
import type { RefObject } from 'react';
import { FigureVisualSizing } from '@/types/accessibility';
import { useNavigate } from '@tanstack/react-router';
import { ExpandedKeySetInstance } from '@/types/keyset/display';
import { KeySet } from '@/types/keyset/core';
import { generateTicks, createChartLegends, createNavigationHandler } from '@/lib/graphing/chart-setup';
import { prepareProportionDataUniversal } from '@/lib/graphing/data-preparation';
import { SessionTerminationOptionsType } from '@/types/terminations';
import { BaseChart } from '@/components/pages/visualize-outcomes/shared/ui/base-chart';
import { ProportionTooltip } from './proportion-elements';
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
import {
  DEFAULT_FIGURE_FONT_FAMILY,
  EMPTY_FIGURE_AXIS_MAX_SETTINGS,
  resolveAxisMax,
  type FigureAxisMaxSettings,
  type FigureFontFamily,
} from '@/lib/graphing/figure-text-settings';

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
  FilteredSessions: SavedSessionResult[];
  ScheduleOption: SessionTerminationOptionsType;
  DynamicKeySet: KeySet;
  KeySetFull: ExpandedKeySetInstance[];
  FigureTextSize: FigureVisualSizing;
  ConnectSpans: boolean;
  MinX: number;
  MaxX: number;
  SeriesStyles?: SeriesStyles;
  ShowTitle?: boolean;
  ShowTooltip?: boolean;
  ShowConditionLegend?: boolean;
  ShowKeyLegend?: boolean;
  SingleTarget?: boolean;
  LegendSettings?: LegendSettings;
  FigureLabels?: FigureLabelSettings;
  FontFamily?: FigureFontFamily;
  AxisMax?: FigureAxisMaxSettings;
  divRef: RefObject<HTMLDivElement | null>;
};

export default function ProportionFigureVisualization({
  Group,
  Individual,
  Evaluation,
  FilteredSessions,
  ScheduleOption,
  DynamicKeySet,
  KeySetFull,
  FigureTextSize,
  ConnectSpans,
  MinX,
  MaxX,
  SeriesStyles = EMPTY_SERIES_STYLES,
  ShowTitle = true,
  ShowTooltip = true,
  ShowConditionLegend = true,
  ShowKeyLegend = true,
  SingleTarget = false,
  LegendSettings = DEFAULT_LEGEND_SETTINGS,
  FigureLabels = EMPTY_FIGURE_LABEL_SETTINGS,
  FontFamily = DEFAULT_FIGURE_FONT_FAMILY,
  AxisMax = EMPTY_FIGURE_AXIS_MAX_SETTINGS,
  divRef,
}: Props) {
  const navigate = useNavigate({
    from: `/session/$group/$individual/$evaluation/proportion`,
  });

  //const { preparedData } = prepareProportionData(FilteredSessions, ScheduleOption);

  const labels = resolveFigureLabels(FigureLabels, FIGURE_LABEL_DEFAULTS.proportion);
  const effectiveMaxX = resolveAxisMax(AxisMax.overrideXMax, AxisMax.xMax, MinX, MaxX);
  const x_ticks = generateTicks(effectiveMaxX, MinX);
  const legends = createChartLegends(FilteredSessions, KeySetFull, SeriesStyles, SingleTarget);
  const onNavigate = createNavigationHandler(navigate, Group, Individual, Evaluation);

  const yAxisConfig = {
    min: 0,
    max: 100,
    domain: [0, 100] as [number, number],
    label: labels.yAxis,
    padding: { bottom: 10 },
  };

  const durationCalculations = processMultipleSessionDataWithKeys(
    FilteredSessions,
    DynamicKeySet,
    convertLegacyTimerType(ScheduleOption, DynamicKeySet),
    'CHART_ALL',
    {
      frequencyKeys: DynamicKeySet.FrequencyKeys,
      durationKeys: [],
      derivedKeys: DynamicKeySet.DerivedKeys,
    },
  );

  const { preparedData } = prepareProportionDataUniversal(durationCalculations);

  return (
    <div className="flex flex-col gap-4 w-full">
      <BaseChart
        title={labels.title}
        preparedData={preparedData}
        filteredSessions={FilteredSessions}
        keySetFull={KeySetFull}
        seriesStyles={SeriesStyles}
        textPage="proportion"
        showTitle={ShowTitle}
        showTooltip={ShowTooltip}
        showConditionLegend={ShowConditionLegend}
        showKeyLegend={ShowKeyLegend}
        legendSettings={LegendSettings}
        xAxisLabel={labels.xAxis}
        figureTextSize={FigureTextSize}
        connectSpans={ConnectSpans}
        minX={MinX}
        maxX={effectiveMaxX}
        xTicks={x_ticks}
        fontFamily={FontFamily}
        legends={legends}
        yAxisConfig={yAxisConfig}
        customTooltip={ProportionTooltip}
        onNavigate={onNavigate}
        divRef={divRef}
      />
    </div>
  );
}
