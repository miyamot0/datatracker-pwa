/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  Label,
  YAxis,
  Tooltip,
  Legend,
  ZAxis,
} from 'recharts';
import { FIGURE_PATH_COLORS } from '@/lib/colors';
import { getShape } from '@/lib/shapes';
import { SessionTerminationOptionsType } from '@/routes/session/$group/$individual/$evaluation/-components/session-designer/forms/schema/session-designer-schema';
import { generateChartPreparation, generateTicks, GetUniqueConditions } from '../helpers/filtering';
import { SavedSessionResult } from '@/lib/dtos';
import { useGenerateImage } from 'recharts-to-png';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FIGURE_TEXT_OPTIONS, FigureVisualSizing } from '@/types/accessibility';
import { useNavigate } from '@tanstack/react-router';

export type ExpandedKeySetInstance = {
  KeyDescription: string;
  Visible: boolean;
};

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
  FilteredSessions: SavedSessionResult[];
  ScheduleOption: SessionTerminationOptionsType;
  CTBKeys: ExpandedKeySetInstance[];
  KeySetFull: ExpandedKeySetInstance[];
  FigureTextSize: FigureVisualSizing;
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
}: Props) {
  const [getDivPng, { ref: divRef }] = useGenerateImage<HTMLDivElement>();
  const navigate = useNavigate({
    from: `/session/$group/$individual/$evaluation/rate`,
  });

  let maxY = 0;

  const { Data, MinX, MaxX } = generateChartPreparation(FilteredSessions, ScheduleOption, 'Frequency');

  const preparedData = Data.map((data) => {
    // eslint-disable-next-line prefer-const
    let temp_obj = {} as any;
    temp_obj.session = data.Session;
    temp_obj.Condition = data.Condition;
    temp_obj.SessionTime = data.SessionTime;

    const min_in_session = data.SessionTime / 60;

    data.Scores.map((key) => {
      const rate_calc = key.Value / min_in_session;

      temp_obj[`${key.KeyDescription}`] = rate_calc;

      if (maxY < rate_calc) {
        maxY = rate_calc;
      }
    });

    const ctb_calc = CTBKeys.filter((k) => k.Visible === true)
      .map((key) => {
        const pull_value = data.Scores.find((s) => s.KeyDescription === key.KeyDescription);

        return pull_value ? pull_value.Value : 0;
      })
      .reduce((a, b) => a + b, 0);

    temp_obj.CTB = ctb_calc / min_in_session;

    return temp_obj;
  });

  const data_set_parsed_by_condition = GetUniqueConditions(FilteredSessions).map((condition) => {
    return {
      name: condition,
      data: preparedData.filter((data) => data.Condition === condition),
    };
  });

  const x_span = MaxX - MinX;
  const x_ticks = generateTicks(x_span, MinX);

  const CustomTooltip = ({ active, payload }: { active: boolean; payload: any[] }) => {
    if (active && payload && payload.length) {
      const main_payload = payload[0].payload;

      const { Condition } = main_payload;
      const relevant_payloads = payload.filter(
        (entry) => entry.payload.Condition === Condition && !entry.name.includes('-Points_'),
      );
      const relevant_payloads_unique = relevant_payloads
        .filter((entry, index, self) => {
          return index === self.findIndex((t) => t.dataKey === entry.dataKey);
        })
        .filter((entry) => !Number.isNaN(entry.value));

      return (
        <div
          className={cn('bg-primary-foreground p-4 border rounded', {
            'text-xl': FigureTextSize == FIGURE_TEXT_OPTIONS[1].value,
            'text-2xl': FigureTextSize == FIGURE_TEXT_OPTIONS[2].value,
          })}
        >
          <p className="font-bold">{`Session #${main_payload.session} (${Condition})`}</p>
          <p className="font-semibold mb-2">{`Session Time: ${(main_payload.SessionTime / 60).toPrecision(2)} min`}</p>

          <div className="flex flex-col ">
            {relevant_payloads_unique.map((entry, index) => {
              const cleaned_up_tag = entry.dataKey
                .toString()
                .replace(payload[0].payload.Condition, '')
                .replace('-', '');

              const rate_per_min = entry.value;
              const total_count = (rate_per_min * main_payload.SessionTime) / 60;

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
  };

  const legend_1: any[] = data_set_parsed_by_condition.map((item, index) => ({
    id: item.name,
    type: 'circle',
    legendIcon: <></>,
    value: item.name,
    color: FIGURE_PATH_COLORS[index % FIGURE_PATH_COLORS.length],
  }));

  const legend_2 = KeySetFull.filter((key) => key.Visible === true).map((item, index) => ({
    id: item.KeyDescription,
    type: getShape(index),
    value: item.KeyDescription,
    color: 'black',
  }));

  legend_1.push(...legend_2);

  let markerSize = 100;

  if (FigureTextSize == 'large') {
    markerSize = 150;
  } else if (FigureTextSize == 'extraLarge') {
    markerSize = 200;
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <ResponsiveContainer
        width="100%"
        height={500}
        className={cn('text-base text-primary bg-white', {
          'text-xl': FigureTextSize == FIGURE_TEXT_OPTIONS[1].value,
          'text-2xl': FigureTextSize == FIGURE_TEXT_OPTIONS[2].value,
        })}
        ref={divRef}
      >
        <ComposedChart
          width={600}
          height={300}
          title=""
          margin={{
            top: 50,
            right: 10,
            left: 10,
            bottom: 10,
          }}
        >
          <text x={'50%'} y={25} textAnchor="middle" dominantBaseline="central">
            <tspan className="text-2xl font-bold">Visualization of Data as Rates</tspan>
          </text>

          {data_set_parsed_by_condition.map((condition, index_main) => {
            const index_dynamic = index_main % FIGURE_PATH_COLORS.length;

            const lines = KeySetFull.filter((key) => key.Visible === true).map((key, index) => {
              const shape = getShape(index);

              return (
                <React.Fragment key={`${index_main}-${index}`}>
                  <Line
                    animationDuration={100}
                    connectNulls={true}
                    name={`${key.KeyDescription}-Points_`}
                    data={condition.data}
                    type="linear"
                    points={undefined}
                    legendType="none"
                    dataKey={`${key.KeyDescription}`}
                    stroke={FIGURE_PATH_COLORS[index_dynamic]}
                  />
                  <Scatter
                    data={condition.data}
                    animationDuration={100}
                    onDoubleClick={(props) => {
                      const stringIndex = `${props.session}_${props.Condition}_Primary`;
                      //const linkGenerated = `/session/${Group!}/${Individual!}/${Evaluation!}/history/${stringIndex}`;

                      navigate({
                        to: '/session/$group/$individual/$evaluation/history/$index',
                        params: {
                          group: Group,
                          individual: Individual,
                          evaluation: Evaluation,
                          index: stringIndex,
                        },
                      });
                    }}
                    dataKey={`${key.KeyDescription}`}
                    fill={FIGURE_PATH_COLORS[index_dynamic]}
                    shape={shape}
                  />
                </React.Fragment>
              );
            });

            return lines;
          })}

          <ZAxis type="number" range={[markerSize]} />

          <XAxis
            dataKey="session"
            domain={[MinX, MaxX]}
            height={50}
            interval={'equidistantPreserveStart'}
            minTickGap={25}
            ticks={x_ticks}
            type="number"
            dy={5}
            padding={{
              left: 50,
              right: 50,
            }}
            style={{
              stroke: 'black',
              strokeWidth: 1,
            }}
          >
            <Label
              style={{
                textAnchor: 'middle',
                fill: 'black',
                fontWeight: 'bold',
              }}
              offset={0}
              position={'insideBottom'}
              value={'Session'}
            />
          </XAxis>
          <YAxis
            min={0}
            //max={Math.floor(axY / session_minutes) + 1}
            padding={{ bottom: 10 }}
            style={{
              stroke: 'black',
              strokeWidth: 1,
            }}
          >
            <Label
              style={{
                textAnchor: 'middle',
                fill: 'black',
                fontWeight: 'bold',
              }}
              position="insideLeft"
              angle={270}
              value={'Rate per Minute'}
            />
          </YAxis>
          <Tooltip
            animationDuration={100}
            content={
              //@ts-expect-error - recharts is not typed correctly
              <CustomTooltip />
            }
          />
          <Legend payload={legend_1} align="center" />
        </ComposedChart>
      </ResponsiveContainer>
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
