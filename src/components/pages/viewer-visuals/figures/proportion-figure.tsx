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
import { SessionTerminationOptionsType } from '@/forms/schema/session-designer-schema';
import { ExpandedKeySetInstance } from './rate-figure';
import { generateChartPreparation, generateTicks, GetUniqueConditions } from '../helpers/filtering';
import { getShape } from '@/lib/shapes';

type Props = {
  FilteredSessions: SavedSessionResult[];
  ScheduleOption: SessionTerminationOptionsType;
  KeySetFull: ExpandedKeySetInstance[];
};

export default function ProportionFigureVisualization({ FilteredSessions, ScheduleOption, KeySetFull }: Props) {
  const { Data, MinX, MaxX } = generateChartPreparation(FilteredSessions, ScheduleOption, 'Duration');

  const preparedData = Data.map((data) => {
    // eslint-disable-next-line prefer-const, @typescript-eslint/no-explicit-any
    let temp_obj = {} as any;
    temp_obj.session = data.Session;
    temp_obj.Condition = data.Condition;
    temp_obj.SessionTime = data.SessionTime;

    data.Scores.map((key) => {
      temp_obj[`${key.KeyDescription}`] = (key.Value / data.SessionTime) * 100;
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

  const CustomTooltip = ({
    active,
    payload,
  }: {
    active: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any[];
  }) => {
    if (active && payload && payload.length) {
      const main_payload = payload[0].payload;

      const { Condition } = main_payload;

      const relevant_payloads = payload.filter(
        (entry) => entry.payload.Condition === Condition && !entry.name.includes('-Points_')
      );
      const relevant_payloads_unique = relevant_payloads
        .filter((entry, index, self) => {
          return index === self.findIndex((t) => t.dataKey === entry.dataKey);
        })
        .filter((entry) => !Number.isNaN(entry.value));

      return (
        <div className="bg-primary-foreground p-4 border rounded">
          <p className="font-bold">{`Session #${main_payload.session} (${Condition})`}</p>
          <p className="font-semibold text-sm mb-2">{`Session Time: ${(main_payload.SessionTime / 60).toPrecision(
            2
          )} min`}</p>

          <div className="flex flex-col text-sm">
            {relevant_payloads_unique.map((entry, index) => {
              const cleaned_up_tag = entry.dataKey
                .toString()
                .replace(payload[0].payload.Condition, '')
                .replace('-', '');

              return (
                <div key={index} className="flex flex-row justify-between text-sm">
                  <span className="font-semibold mr-2">{cleaned_up_tag}</span>
                  <p key={`item-${index}`} className="text-sm">
                    {`${((entry.value / 100) * main_payload.SessionTime).toFixed(
                      2
                    )} of ${main_payload.SessionTime.toFixed(2)} seconds (${entry.value.toFixed(2)}%)`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return (
    <div className="flex flex-col gap-4 w-full">
      <ResponsiveContainer width="100%" height={500} className={'text-base text-primary bg-white'}>
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
            <tspan className="text-2xl font-bold">Visualization of Data as Proportion of Session</tspan>
          </text>

          {data_set_parsed_by_condition.map((condition, index_main) => {
            const index_dynamic = index_main % FIGURE_PATH_COLORS.length;

            const lines = KeySetFull.filter((key) => key.Visible === true).map((key, index) => {
              const shape: SymbolType = getShape(index);

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
                    stroke="black"
                  />
                </React.Fragment>
              );
            });

            return lines;
          })}

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
    </div>
  );
}
