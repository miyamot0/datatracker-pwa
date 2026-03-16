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
import { SymbolType } from 'recharts/types/util/types';
import { FIGURE_PATH_COLORS } from '@/lib/colors';
import { SavedSessionResult } from '@/lib/dtos';
import { SessionTerminationOptionsType } from '@/components/editor-session/forms/schema/session-designer-schema';
import { generateChartPreparation, generateTicks, GetUniqueConditions, splitAtPoints } from '../helpers/filtering';
import { getShape } from '@/lib/shapes';
import { useGenerateImage } from 'recharts-to-png';
import { Button } from '@/components/ui/button';
import { FIGURE_TEXT_OPTIONS, FigureVisualSizing } from '@/types/accessibility';
import { cn } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router';
import { ExpandedKeySetInstance } from '@/types/keyset';

type Props = {
  Group: string;
  Individual: string;
  Evaluation: string;
  FilteredSessions: SavedSessionResult[];
  ScheduleOption: SessionTerminationOptionsType;
  KeySetFull: ExpandedKeySetInstance[];
  FigureTextSize: FigureVisualSizing;
  ConnectSpans: boolean;
};

const boutNaming = (tag: string) => {
  return `${tag}-Bouts`;
};

const boutAverageNaming = (tag: string) => {
  return `${tag}-Bout-Ave`;
};

function OutputDisplay({ payloads }: { payloads: any[] }) {
  const main_payload = payloads[0].payload;

  const pct_session = (data: any) => {
    return `${data.toFixed(2)}%`;
  };

  const get_seconds = (data: any) => {
    return `${((data * main_payload.SessionTime) / 100).toFixed(2)}s`;
  };

  return (
    <div className="flex flex-col text-sm">
      {payloads.map((entry, index) => {
        const cleaned_up_tag = entry.dataKey.toString().replace(payloads[0].payload.Condition, '').replace('-', '');

        const bout_n = entry.payload[boutNaming(entry.name)];
        const bout_ave = entry.payload[boutAverageNaming(entry.name)];

        return (
          <div key={index} className="flex flex-col mb-1">
            <div className="flex flex-row justify-between text-sm">
              <span className="font-semibold mr-2">{`${cleaned_up_tag} Total`}</span>
              <p className="text-sm">{get_seconds(entry.value)}</p>
            </div>
            <div className="flex flex-row justify-between text-sm">
              <span className="font-semibold mr-2">{`${cleaned_up_tag} %`}</span>
              <p className="text-sm">{pct_session(entry.value)}</p>
            </div>
            <div className="flex flex-row justify-between text-sm">
              <span className="font-semibold mr-2">{`${cleaned_up_tag} Bouts`}</span>
              <p className="text-sm">{bout_n !== undefined ? `${bout_n}` : 'N/A'}</p>
            </div>
            <div className="flex flex-row justify-between text-sm">
              <span className="font-semibold mr-2">{`${cleaned_up_tag} Ave`}</span>
              <p key={`item-${index}`} className="text-sm">
                {bout_ave !== undefined && bout_ave !== 0 ? `${bout_ave}s` : 'N/A'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ProportionFigureVisualization({
  Group,
  Individual,
  Evaluation,
  FilteredSessions,
  ScheduleOption,
  KeySetFull,
  FigureTextSize,
  ConnectSpans,
}: Props) {
  const [getDivPng, { ref: divRef }] = useGenerateImage<HTMLDivElement>();
  const navigate = useNavigate({
    from: `/session/$group/$individual/$evaluation/proportion/`,
  });

  const { Data, MinX, MaxX } = generateChartPreparation(FilteredSessions, ScheduleOption, 'Duration');

  const preparedData = Data.map((data) => {
    const temp_obj = {} as any;
    temp_obj.session = data.Session;
    temp_obj.Condition = data.Condition;
    temp_obj.SessionTime = data.SessionTime;

    data.Scores.map((key) => {
      temp_obj[`${key.KeyDescription}`] = (key.Value / data.SessionTime) * 100;
      temp_obj[boutNaming(key.KeyDescription)] = key.Bouts;
      temp_obj[boutAverageNaming(key.KeyDescription)] = key.Bouts > 0 ? (key.Value / key.Bouts).toFixed(2) : 0;
    });

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

          <OutputDisplay payloads={relevant_payloads_unique} />
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

  const legend_2 = KeySetFull.filter((key) => key.Visible).map((item, index) => ({
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
      <ResponsiveContainer width="100%" height={500} className={'text-base text-primary bg-white'} ref={divRef}>
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
          className={cn('text-base text-primary bg-white', {
            'text-xl': FigureTextSize == FIGURE_TEXT_OPTIONS[1].value,
            'text-2xl': FigureTextSize == FIGURE_TEXT_OPTIONS[2].value,
          })}
        >
          <text x={'50%'} y={25} textAnchor="middle" dominantBaseline="central">
            <tspan className="text-2xl font-bold">Visualization of Data as Proportion of Session</tspan>
          </text>

          {data_set_parsed_by_condition.map((condition, index_main) => {
            const index_dynamic = index_main % FIGURE_PATH_COLORS.length;

            const lines = KeySetFull.filter((key) => key.Visible === true).map((key, index) => {
              const shape: SymbolType = getShape(index);

              const splitPoints = [] as number[];

              for (let i = 1; i < condition.data.length; i++) {
                const current = condition.data[i].session;
                const prev = condition.data[i - 1].session;

                const checkedData = FilteredSessions.filter(
                  (session) =>
                    session.SessionSettings.Session > prev &&
                    session.SessionSettings.Session < current &&
                    session.SessionSettings.Condition !== condition.name,
                );

                if (checkedData.length > 0) {
                  splitPoints.push(i);
                }
              }

              if (splitPoints.length === 0 || ConnectSpans === true) {
                return (
                  <React.Fragment key={`${index_main}-${index}`}>
                    <Line
                      connectNulls={true}
                      name={`${key.KeyDescription}-Points_`}
                      data={condition.data}
                      type="linear"
                      //dot={dot_func}
                      points={undefined}
                      legendType="none"
                      dataKey={`${key.KeyDescription}`}
                      stroke={FIGURE_PATH_COLORS[index_dynamic]}
                    />
                    <Scatter
                      data={condition.data}
                      dataKey={`${key.KeyDescription}`}
                      fill={FIGURE_PATH_COLORS[index_dynamic]}
                      shape={shape}
                      onDoubleClick={(props) => {
                        const stringIndex = `${props.session}_${props.Condition}_Primary`;
                        //const linkGenerated = `/session/${Group!}/${Individual!}/${Evaluation!}/history/${stringIndex}`;

                        navigate({
                          to: '/session/$group/$individual/$evaluation/history/view/$file',
                          params: {
                            group: Group,
                            individual: Individual,
                            evaluation: Evaluation,
                            file: stringIndex,
                          },
                        });
                      }}
                      stroke="black"
                    />
                  </React.Fragment>
                );
              }

              const splitData = splitAtPoints(condition.data, splitPoints);

              return (
                <React.Fragment key={`${index_main}-${index}`}>
                  {splitData.map((segment, segment_index) => (
                    <React.Fragment key={`segment-${index_main}-${index}-${segment_index}`}>
                      <Line
                        connectNulls={true}
                        name={`${key.KeyDescription}-Points_`}
                        data={segment}
                        type="linear"
                        //dot={dot_func}
                        points={undefined}
                        legendType="none"
                        dataKey={`${key.KeyDescription}`}
                        stroke={FIGURE_PATH_COLORS[index_dynamic]}
                      />
                      <Scatter
                        data={segment}
                        dataKey={`${key.KeyDescription}`}
                        fill={FIGURE_PATH_COLORS[index_dynamic]}
                        shape={shape}
                        onDoubleClick={(props) => {
                          const stringIndex = `${props.session}_${props.Condition}_Primary`;
                          //const linkGenerated = `/session/${Group!}/${Individual!}/${Evaluation!}/history/${stringIndex}`;

                          navigate({
                            to: '/session/$group/$individual/$evaluation/history/view/$file',
                            params: {
                              group: Group,
                              individual: Individual,
                              evaluation: Evaluation,
                              file: stringIndex,
                            },
                          });
                        }}
                        stroke="black"
                      />
                    </React.Fragment>
                  ))}
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
              offset={5}
              position={'insideBottom'}
              value={'Session'}
            />
          </XAxis>
          <YAxis
            min={0}
            max={100}
            domain={[0, 100]}
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
              value={'Percentage of Session Time'}
            />
          </YAxis>
          <ZAxis range={[50]} />
          <Tooltip
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
