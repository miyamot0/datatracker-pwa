import { SymbolType } from 'recharts/types/util/types';
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
import { ExpandedSavedSessionResult } from '@/lib/dtos/session-results';
import { CustomTooltipProps, PlotPoint } from '@/types/visuals';
import { KeyManageType } from '@/types/timing';
import { createChartLegends, generateTicks } from '@/lib/graphing/chart-setup';
import { AxisSpanLines } from '@/components/pages/visualize-outcomes/shared/axis-span-lines';
import { ChartLegendContent } from '@/components/pages/visualize-outcomes/shared/chart-legend-content';
import {
  EMPTY_SERIES_STYLES,
  DEFAULT_LINE_COLOR,
  isSeriesHidden,
  resolveKeyFillColor,
  resolveKeyShape,
  resolveLineColor,
  resolveMarkerStroke,
  type SeriesStyles,
} from '@/lib/graphing/series-style';

type Props = {
  Session?: ExpandedSavedSessionResult;
  PlotData?: PlotPoint[];
  KeysHidden: ExpandedKeySetInstance[];
  SeriesStyles?: SeriesStyles;
};

const noAnimationProps = {
  isAnimationActive: false,
  animationDuration: 0,
};

export default function SessionFigure({ Session, PlotData, KeysHidden, SeriesStyles = EMPTY_SERIES_STYLES }: Props) {
  if (!Session || !PlotData) return <></>;

  const keys_to_skip = KeysHidden.filter((k) => k.Visible === false).map((k) => k.KeyDescription);
  const sessionCondition = Session.SessionSettings.Condition;

  // Same visible-key order and default styling as the proportion and rate figures
  const visibleKeys = Session.Keyset.FrequencyKeys.filter((k) => keys_to_skip.includes(k.KeyDescription) === false);
  const legends = createChartLegends(
    [Session],
    Session.Keyset.FrequencyKeys.map((k) => ({
      KeyDescription: k.KeyDescription,
      Visible: keys_to_skip.includes(k.KeyDescription) === false,
    })) as ExpandedKeySetInstance[],
    SeriesStyles,
  );

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const main_payload = payload[0].payload;

      const plotted_keys = Object.keys(main_payload).filter(
        (key) =>
          key !== 'second' &&
          !keys_to_skip.includes(key) &&
          !isSeriesHidden(SeriesStyles, key, sessionCondition) &&
          Number.isFinite(main_payload[key]),
      );

      return (
        <div className="bg-primary-foreground p-4 border rounded">
          <p className="font-bold">{`Time into Session: ${main_payload.second}s`}</p>

          <div className="flex flex-col text-sm">
            {plotted_keys.map((key) => {
              return (
                <div key={key} className="flex flex-row justify-between text-sm">
                  <span className="font-semibold mr-2">{key.replace('-', '')}</span>
                  <p className="text-sm">{`${main_payload[key]} Instances`}</p>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  const yValues = PlotData.map((point) => {
    const keys = Object.keys(point).filter((k) => k !== 'second');
    const filteredKeys = keys.filter((key) => keys_to_skip.includes(key) === false);

    return filteredKeys.map((key) => point[key]);
  }).flat();

  const maxYValue = Math.max(...yValues) + 1;
  const yTicks = generateTicks(maxYValue, 0);

  const maxXValue = Math.floor(Session.TimerMain) + 1;
  const xTicks = generateTicks(maxXValue, 0);

  return (
    <div className="flex flex-col gap-4 w-full">
      <ResponsiveContainer
        width="100%"
        height={500}
        className={
          'text-base text-primary bg-white nuke-view-transition [&_.recharts-legend-item]:inline-flex! [&_.recharts-legend-item]:items-center'
        }
      >
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

          {visibleKeys.map((key: KeySetInstance, index: number) => {
            // Matches BaseChart: markers default to the condition's palette colour, one condition per session
            const sessionMarkerFill = resolveKeyFillColor(
              SeriesStyles,
              key.KeyDescription,
              sessionCondition,
              FIGURE_PATH_COLORS[0],
            );

            return (
              <React.Fragment key={index}>
                <Line
                  {...noAnimationProps}
                  animationDuration={100}
                  connectNulls={true}
                  name={`${key.KeyDescription}-Points_`}
                  data={PlotData}
                  type="linear"
                  legendType="none"
                  dot={false}
                  activeDot={false}
                  dataKey={`${key.KeyDescription}`}
                  stroke={resolveLineColor(SeriesStyles, key.KeyDescription, sessionCondition, DEFAULT_LINE_COLOR)}
                />
                <Scatter
                  name={key.KeyDescription}
                  {...noAnimationProps}
                  data={PlotData}
                  animationDuration={100}
                  dataKey={`${key.KeyDescription}`}
                  fill={sessionMarkerFill}
                  shape={resolveKeyShape(SeriesStyles, key.KeyDescription, getShape(index))}
                  stroke={resolveMarkerStroke(sessionMarkerFill)}
                />
              </React.Fragment>
            );
          })}

          <XAxis
            {...noAnimationProps}
            axisLine={false}
            dataKey="second"
            domain={[0, maxXValue]}
            ticks={xTicks}
            height={50}
            interval={'preserveStartEnd'}
            minTickGap={50}
            type="number"
            dy={5}
            padding={{
              left: 25,
              right: 25,
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
            axisLine={false}
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
          <AxisSpanLines />
          <Tooltip {...noAnimationProps} wrapperStyle={{ zIndex: 10 }} content={<CustomTooltip />} />

          <Legend {...noAnimationProps} align="center" content={() => <ChartLegendContent payload={legends} />} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
