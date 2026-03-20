import { FIGURE_PATH_COLORS } from '@/lib/colors';
import { getShape } from '@/lib/shapes';
import React from 'react';
import {
  ComposedChart,
  ReferenceLine,
  Label,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ExpandedKeySetInstance, KeySetInstance } from '@/types/keyset';
import { ExpandedSavedSessionResult } from '@/lib/dtos';
import { CustomTooltipProps, PlotPoint } from '@/types/visuals';
import { KeyManageType } from '@/types/timing';
import { generateTicks } from '@/lib/graphing';

type Props = {
  Session?: ExpandedSavedSessionResult;
  PlotData?: PlotPoint[];
  KeysHidden: ExpandedKeySetInstance[];
};

const noAnimationProps = {
  isAnimationActive: false,
  animationDuration: 0,
};

export default function SessionFigure({ Session, PlotData, KeysHidden }: Props) {
  if (!Session || !PlotData) return <></>;

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
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
        <div className="bg-primary-foreground p-4 border rounded">
          <p className="font-bold">{`Time into Session: ${main_payload.second}s`}</p>

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
                    {`${entry.value} Instances`}
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

  const keys_to_skip = KeysHidden.filter((k) => k.Visible === false).map((k) => k.KeyDescription);

  const yValues = PlotData.map((point) => {
    const keys = Object.keys(point).filter((k) => k !== 'second');
    const filteredKeys = keys.filter((key) => keys_to_skip.includes(key) === false);

    return filteredKeys.map((key) => point[key]);
  }).flat();

  const maxYValue = Math.max(...yValues) + 1;
  const yTicks = generateTicks(maxYValue, 0);

  return (
    <div className="flex flex-col gap-4 w-full">
      <ResponsiveContainer width="100%" height={500} className={'text-base text-primary bg-white nuke-view-transition'}>
        <ComposedChart
          {...noAnimationProps}
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
            <tspan className="text-2xl font-bold">Within-session Visualization of Session Data</tspan>
          </text>

          {Session.SystemKeyPresses.filter((k) => k.KeyScheduleRecording === 'Secondary').map(
            (press: KeyManageType, index_of_ref: number) => {
              return (
                <ReferenceLine
                  {...noAnimationProps}
                  key={`ref-secondary-${index_of_ref}`}
                  x={press.TimeIntoSession}
                  stroke="red"
                  label={
                    index_of_ref % 2 === 0 ? (
                      <Label
                        {...noAnimationProps}
                        value={'Timer #2'}
                        position={{ x: press.TimeIntoSession, y: 0 }}
                        fill="black"
                        style={{ textAnchor: 'middle' }}
                      />
                    ) : undefined
                  }
                />
              );
            },
          )}

          {Session.SystemKeyPresses.filter((k) => k.KeyScheduleRecording === 'Tertiary').map(
            (press: KeyManageType, index_of_ref: number) => {
              return (
                <ReferenceLine
                  {...noAnimationProps}
                  key={`ref-tertiary-${index_of_ref}`}
                  x={press.TimeIntoSession}
                  stroke="blue"
                  label={
                    index_of_ref % 2 === 0 ? (
                      <Label
                        {...noAnimationProps}
                        value={'Timer #3'}
                        position={{ x: press.TimeIntoSession, y: 0 }}
                        fill="black"
                        style={{ textAnchor: 'middle' }}
                      />
                    ) : undefined
                  }
                />
              );
            },
          )}

          {Session.Keyset.FrequencyKeys.filter((k) => keys_to_skip.includes(k.KeyDescription) === false).map(
            (key: KeySetInstance, index: number) => {
              return (
                <React.Fragment key={index}>
                  <Line
                    {...noAnimationProps}
                    animationDuration={100}
                    connectNulls={true}
                    name={`${key.KeyDescription}-Points_`}
                    data={PlotData}
                    type="linear"
                    points={undefined}
                    legendType="none"
                    dataKey={`${key.KeyDescription}`}
                    stroke={FIGURE_PATH_COLORS[index]}
                  />
                  <Scatter
                    {...noAnimationProps}
                    data={PlotData}
                    animationDuration={100}
                    dataKey={`${key.KeyDescription}`}
                    fill={FIGURE_PATH_COLORS[index]}
                    shape={getShape(index)}
                  />
                </React.Fragment>
              );
            },
          )}

          <XAxis
            {...noAnimationProps}
            dataKey="second"
            domain={[0, Math.floor(Session.TimerMain) + 1]}
            height={50}
            interval={'equidistantPreserveStart'}
            minTickGap={25}
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
              {...noAnimationProps}
              style={{
                textAnchor: 'middle',
                fill: 'black',
                fontWeight: 'bold',
              }}
              offset={5}
              position={'insideBottom'}
              value={'Seconds Elapsed'}
            />
          </XAxis>
          <YAxis
            {...noAnimationProps}
            min={0}
            max={maxYValue}
            range={[0, maxYValue]}
            domain={[0, maxYValue]}
            ticks={[...yTicks, maxYValue]}
            padding={{ bottom: 10 }}
            style={{
              stroke: 'black',
              strokeWidth: 1,
            }}
          >
            <Label
              {...noAnimationProps}
              style={{
                textAnchor: 'middle',
                fill: 'black',
                fontWeight: 'bold',
              }}
              position="insideLeft"
              angle={270}
              value={'Event Recording During Session'}
            />
          </YAxis>
          <Tooltip {...noAnimationProps} content={<CustomTooltip />} />
          <Legend
            {...noAnimationProps}
            payload={Session.Keyset.FrequencyKeys.filter((k) => keys_to_skip.includes(k.KeyDescription) === false).map(
              (item: KeySetInstance, index: number) => ({
                id: item.KeyDescription,
                type: getShape(index),
                value: item.KeyDescription,

                color: FIGURE_PATH_COLORS[index % FIGURE_PATH_COLORS.length],
              }),
            )}
            align="center"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
