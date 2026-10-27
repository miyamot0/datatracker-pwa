import { SavedSessionResult } from '@/lib/dtos/session-results';
import type { UseGenerateImage } from 'recharts-to-png';
import { Button } from '@/components/ui/button';
import { savePngFile } from '@/components/pages/visualize-outcomes/shared/save-png';
import { type FigureVisualSizing } from '@/types/accessibility';
import { useNavigate } from '@tanstack/react-router';
import { ExpandedKeySetInstance, KeySet } from '@/types/keyset';
import { generateTicks, createChartLegends, createNavigationHandler } from '@/lib/graphing/chart-setup';
import { prepareRateDataUniversal } from '@/lib/graphing/data-preparation';
import { SessionTerminationOptionsType } from '@/types/terminations';
import { BaseChart } from '@/components/pages/visualize-outcomes/shared/base-chart';
import { RateTooltip } from './rate-elements';
import { processMultipleSessionDataWithKeys } from '@/lib/calculations';
import { convertLegacyTimerType } from '@/lib/calculations/calculation-helpers';
import { EMPTY_SERIES_STYLES, type SeriesStyles } from '@/lib/graphing/series-style';

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
  getDivPng: UseGenerateImage<HTMLDivElement>[0];
  divRef: UseGenerateImage<HTMLDivElement>[1]['ref'];
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
  getDivPng,
  divRef,
}: Props) {
  const navigate = useNavigate({
    from: `/session/$group/$individual/$evaluation/rate`,
  });

  const x_ticks = generateTicks(MaxX, MinX);
  const legends = createChartLegends(FilteredSessions, KeySetFull, SeriesStyles);
  const onNavigate = createNavigationHandler(navigate, Group, Individual, Evaluation);

  const yAxisConfig = {
    min: 0,
    label: 'Responses per Min',
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
        title="Visualization of Data as Rates"
        preparedData={preparedData}
        filteredSessions={FilteredSessions}
        keySetFull={KeySetFull}
        seriesStyles={SeriesStyles}
        textPage="rate"
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
      <Button onClick={() => savePngFile(getDivPng)}>{'Download Figure as PNG'}</Button>
    </div>
  );
}
