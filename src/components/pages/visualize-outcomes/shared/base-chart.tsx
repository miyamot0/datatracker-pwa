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
  DefaultLegendContent,
} from 'recharts';
import { SymbolType } from 'recharts/types/util/types';
import { FIGURE_PATH_COLORS } from '@/lib/colors';
import { getShape } from '@/lib/shapes';
import { SavedSessionResult } from '@/lib/dtos/session-results';
import { cn } from '@/lib/utils';
import { FIGURE_TEXT_OPTIONS, type FigureVisualSizing } from '@/types/accessibility';
import { ExpandedKeySetInstance } from '@/types/keyset';
import { splitAtPoints } from '@/lib/arrays';
import { getUniqueSessionConditions } from '@/lib/graphing/session-filters';
import { calculateSplitPoints } from '@/lib/graphing/data-preparation';
import { getChartConfiguration } from '@/lib/graphing/chart-setup';
import { AxisSpanLines } from './axis-span-lines';

type BaseChartProps = {
  title: string;
  preparedData: any[];
  filteredSessions: SavedSessionResult[];
  keySetFull: ExpandedKeySetInstance[];
  figureTextSize: FigureVisualSizing;
  connectSpans: boolean;
  minX: number;
  maxX: number;
  xTicks: number[];
  legends: any[];
  yAxisConfig: {
    min?: number;
    max?: number;
    domain?: [number, number];
    label?: string;
    padding?: { bottom?: number };
  };
  customTooltip: React.ComponentType<any>;
  onNavigate: (props: any) => void;
  divRef: React.RefObject<HTMLDivElement | null>;
};

export function BaseChart({
  title,
  preparedData,
  filteredSessions,
  keySetFull,
  figureTextSize,
  connectSpans,
  minX,
  maxX,
  xTicks,
  legends,
  yAxisConfig,
  customTooltip: CustomTooltip,
  onNavigate,
  divRef,
}: BaseChartProps) {
  const { noAnimationProps, chartMargins, xAxisConfig, yAxisStyle, labelStyle } = getChartConfiguration();

  const data_set_parsed_by_condition = getUniqueSessionConditions(filteredSessions).map((condition) => ({
    name: condition,
    data: preparedData.filter((data) => data.Condition === condition),
  }));

  const visibleKeys = keySetFull.filter((key) => key.Visible === true).map((key) => key.KeyDescription);
  const hasPlottedData = visibleKeys.length > 0 && preparedData.length > 0 && data_set_parsed_by_condition.length > 0;

  let markerSize = 100;
  if (figureTextSize == 'large') {
    markerSize = 150;
  } else if (figureTextSize == 'extraLarge') {
    markerSize = 200;
  }

  return (
    <ResponsiveContainer
      {...noAnimationProps}
      width="100%"
      height={500}
      className={cn(
        'text-base text-primary bg-white nuke-view-transition [&_.recharts-legend-item]:!inline-flex [&_.recharts-legend-item]:items-center',
        {
          'text-xl': figureTextSize == FIGURE_TEXT_OPTIONS[1].value,
          'text-2xl': figureTextSize == FIGURE_TEXT_OPTIONS[2].value,
        },
      )}
      ref={divRef}
    >
      <ComposedChart
        className="nuke-view-transition"
        {...noAnimationProps}
        width={600}
        height={300}
        title=""
        margin={chartMargins}
      >
        <text x={'50%'} y={25} textAnchor="middle" dominantBaseline="central">
          <tspan className="text-2xl font-bold">{title}</tspan>
        </text>

        {data_set_parsed_by_condition.map((condition, index_main) => {
          const index_dynamic = index_main % FIGURE_PATH_COLORS.length;

          const lines = keySetFull
            .filter((key) => key.Visible === true)
            .map((key, index) => {
              const shape: SymbolType = getShape(index);
              const splitPoints = calculateSplitPoints(condition.data, filteredSessions, condition.name);

              if (splitPoints.length === 0 || connectSpans === true) {
                return (
                  <React.Fragment key={`${index_main}-${index}`}>
                    <Line
                      {...noAnimationProps}
                      connectNulls={false}
                      name={`${key.KeyDescription}-Points_`}
                      data={condition.data}
                      type="linear"
                      legendType="none"
                      dot={false}
                      activeDot={false}
                      dataKey={`${key.KeyDescription}`}
                      stroke={FIGURE_PATH_COLORS[index_dynamic]}
                    />
                    <Scatter
                      name={key.KeyDescription}
                      data={condition.data}
                      {...noAnimationProps}
                      onDoubleClick={onNavigate}
                      dataKey={`${key.KeyDescription}`}
                      fill={FIGURE_PATH_COLORS[index_dynamic]}
                      shape={shape}
                      stroke="black"
                    />
                  </React.Fragment>
                );
              }

              const splitData = splitAtPoints(condition.data, splitPoints);

              return (
                <React.Fragment key={`${index_main}-${index}`}>
                  {splitData.map((segment, segment_index) => (
                    <React.Fragment key={`${index_main}-${index}-${segment_index}`}>
                      <Line
                        {...noAnimationProps}
                        connectNulls={false}
                        name={`${key.KeyDescription}-Points_`}
                        data={segment}
                        type="linear"
                        legendType="none"
                        dot={false}
                        activeDot={false}
                        dataKey={`${key.KeyDescription}`}
                        stroke={FIGURE_PATH_COLORS[index_dynamic]}
                      />
                      <Scatter
                        name={key.KeyDescription}
                        data={segment}
                        {...noAnimationProps}
                        onDoubleClick={onNavigate}
                        dataKey={`${key.KeyDescription}`}
                        fill={FIGURE_PATH_COLORS[index_dynamic]}
                        shape={shape}
                        stroke="black"
                      />
                    </React.Fragment>
                  ))}
                </React.Fragment>
              );
            });

          return lines;
        })}

        {/* Invisible point so Recharts registers the X scale (and its ticks) when nothing is plotted */}

        {hasPlottedData ? null : (
          <Line
            {...noAnimationProps}
            stroke="none"
            dot={false}
            activeDot={false}
            tooltipType="none"
            legendType="none"
            isAnimationActive={false}
            data={[{ session: minX, placeholder: null }]}
            dataKey="placeholder"
          />
        )}

        <ZAxis {...noAnimationProps} type="number" range={[markerSize, markerSize]} />

        <XAxis
          {...noAnimationProps}
          dataKey="session"
          domain={[minX, maxX]}
          ticks={xTicks}
          {...xAxisConfig}
          axisLine={false}
          label={undefined}
        >
          <Label {...noAnimationProps} style={labelStyle} offset={0} position={'insideBottom'} value={'Session'} />
        </XAxis>

        <YAxis {...noAnimationProps} {...yAxisConfig} axisLine={false} style={yAxisStyle} label={undefined}>
          <Label {...noAnimationProps} style={labelStyle} position="insideLeft" angle={270} value={yAxisConfig.label} />
        </YAxis>

        <AxisSpanLines />

        <Tooltip
          {...noAnimationProps}
          animationDuration={100}
          wrapperStyle={{ zIndex: 10 }}
          content={<CustomTooltip figureTextSize={figureTextSize} visibleKeys={visibleKeys} />}
        />

        <Legend
          {...noAnimationProps}
          align="center"
          content={(props) => <DefaultLegendContent {...props} payload={legends} />}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
