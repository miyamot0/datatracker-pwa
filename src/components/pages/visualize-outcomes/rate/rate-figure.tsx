import { SavedSessionResult } from '@/lib/dtos';
import { useGenerateImage } from 'recharts-to-png';
import { Button } from '@/components/ui/button';
import { type FigureVisualSizing } from '@/types/accessibility';
import { useNavigate } from '@tanstack/react-router';
import { ExpandedKeySetInstance } from '@/types/keyset';
import { generateTicks, createChartLegends, createNavigationHandler, prepareRateData } from '@/lib/graphing';
import { SessionTerminationOptionsType } from '@/types/terminations';
import { BaseChart } from '@/components/pages/visualize-outcomes/shared/base-chart';
import { RateTooltip } from './rate-elements';

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
  FilteredSessions: SavedSessionResult[];
  ScheduleOption: SessionTerminationOptionsType;
  CTBKeys: ExpandedKeySetInstance[];
  KeySetFull: ExpandedKeySetInstance[];
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
  CTBKeys,
  KeySetFull,
  FigureTextSize,
  ConnectSpans,
  MinX,
  MaxX,
}: Props) {
  const [getDivPng, { ref: divRef }] = useGenerateImage<HTMLDivElement>();
  const navigate = useNavigate({
    from: `/session/$group/$individual/$evaluation/rate/`,
  });

  const { preparedData } = prepareRateData(FilteredSessions, ScheduleOption, CTBKeys);

  const x_ticks = generateTicks(MaxX, MinX);
  const legends = createChartLegends(FilteredSessions, KeySetFull);
  const onNavigate = createNavigationHandler(navigate, Group, Individual, Evaluation);

  const yAxisConfig = {
    min: 0,
    label: 'Response per Minute',
    padding: { bottom: 10 },
  };

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
