import { SavedSessionResult } from '@/lib/dtos';
import { useGenerateImage } from 'recharts-to-png';
import { Button } from '@/components/ui/button';
import { FigureVisualSizing } from '@/types/accessibility';
import { useNavigate } from '@tanstack/react-router';
import { ExpandedKeySetInstance, KeySet } from '@/types/keyset';
import {
  generateTicks,
  createChartLegends,
  createNavigationHandler,
  prepareProportionDataUniversal,
} from '@/lib/graphing';
import { SessionTerminationOptionsType } from '@/types/terminations';
import { BaseChart } from '@/components/pages/visualize-outcomes/shared/base-chart';
import { ProportionTooltip } from './proportion-elements';
import { processMultipleSessionDataWithKeys } from '@/lib/calculations';
import { convertLegacyTimerType } from '@/lib/calculations/calculation-helpers';

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
}: Props) {
  const [getDivPng, { ref: divRef }] = useGenerateImage<HTMLDivElement>();
  const navigate = useNavigate({
    from: `/session/$group/$individual/$evaluation/proportion`,
  });

  //const { preparedData } = prepareProportionData(FilteredSessions, ScheduleOption);

  const x_ticks = generateTicks(MaxX, MinX);
  const legends = createChartLegends(FilteredSessions, KeySetFull);
  const onNavigate = createNavigationHandler(navigate, Group, Individual, Evaluation);

  const yAxisConfig = {
    min: 0,
    max: 100,
    domain: [0, 100] as [number, number],
    label: 'Percentage of Session',
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
        title="Visualization of Data as Proportion of Session"
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
        customTooltip={ProportionTooltip}
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
