import { SavedSessionResult } from '@/lib/dtos';
import { useGenerateImage } from 'recharts-to-png';
import { Button } from '@/components/ui/button';
import { type FigureVisualSizing } from '@/types/accessibility';
import { useNavigate } from '@tanstack/react-router';
import { ExpandedKeySetInstance, KeySet } from '@/types/keyset';
import { generateTicks, createChartLegends, createNavigationHandler, prepareRateDataUniversal } from '@/lib/graphing';
import { SessionTerminationOptionsType } from '@/types/terminations';
import { BaseChart } from '@/components/pages/visualize-outcomes/shared/base-chart';
import { RateTooltip } from './rate-elements';
import { processMultipleSessionDataWithKeys } from '@/lib/calculations';
import { convertLegacyTimerType } from '@/calculations/calculation-helpers';

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
}: Props) {
  const [getDivPng, { ref: divRef }] = useGenerateImage<HTMLDivElement>();
  const navigate = useNavigate({
    from: `/session/$group/$individual/$evaluation/rate`,
  });

  const x_ticks = generateTicks(MaxX, MinX);
  const legends = createChartLegends(FilteredSessions, KeySetFull);
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
      <Button
        onClick={async () => {
          const png = await getDivPng();
          if (png) {
            const link = document.createElement('a');
            link.href = png;
            link.download = 'figure.png';
            link.click();
          }
        }}
      >
        {'Download Figure as PNG'}
      </Button>
    </div>
  );
}
