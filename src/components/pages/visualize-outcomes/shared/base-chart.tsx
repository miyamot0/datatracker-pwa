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
  ReferenceLine,
} from 'recharts';
import { SymbolType } from 'recharts/types/util/types';
import { FIGURE_PATH_COLORS } from '@/lib/colors';
import { getShape } from '@/lib/shapes';
import { ChartLegendContent } from '@/components/pages/visualize-outcomes/shared/legends/chart-legend-content';
import {
  EMPTY_SERIES_STYLES,
  DEFAULT_LINE_COLOR,
  PHASE_LINE_COLOR,
  PHASE_LINE_DASH_ARRAY,
  isSeriesHidden,
  resolveKeyFillColor,
  resolveKeyShape,
  resolveLineColor,
  resolveMarkerStroke,
  type SeriesStyles,
} from '@/lib/graphing/series-style';
import { SavedSessionResult } from '@/lib/dtos/session-results';
import { cn } from '@/lib/utils';
import { FIGURE_TEXT_OPTIONS, type FigureVisualSizing } from '@/types/accessibility';
import { ExpandedKeySetInstance } from '@/types/keyset';
import { splitAtPoints } from '@/lib/arrays';
import { getUniqueSessionConditions } from '@/lib/graphing/session-filters';
import { calculateSplitPoints } from '@/lib/graphing/data-preparation';
import { getChartConfiguration } from '@/lib/graphing/chart-setup';
import { AxisSpanLines } from './annotations/axis-span-lines';
import { TextAnnotationsLayer } from './annotations/text-annotations-layer';

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
  seriesStyles?: SeriesStyles;
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
  seriesStyles = EMPTY_SERIES_STYLES,
}: BaseChartProps) {
  const { noAnimationProps, chartMargins, xAxisConfig, yAxisStyle, labelStyle } = getChartConfiguration();

  const data_set_parsed_by_condition = getUniqueSessionConditions(filteredSessions).map((condition) => ({
    name: condition,
    data: preparedData.filter((data) => data.Condition === condition),
  }));

  const visibleKeys = keySetFull.filter((key) => key.Visible === true).map((key) => key.KeyDescription);
  const hiddenKeysByCondition = Object.fromEntries(
    getUniqueSessionConditions(filteredSessions).map((condition) => [
      condition,
      visibleKeys.filter((key) => isSeriesHidden(seriesStyles, key, condition)),
    ]),
  );
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
        'text-base text-primary bg-white nuke-view-transition [&_.recharts-legend-item]:inline-flex! [&_.recharts-legend-item]:items-center',
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
              const shape: SymbolType = resolveKeyShape(seriesStyles, key.KeyDescription, getShape(index));
              const line_color = resolveLineColor(seriesStyles, key.KeyDescription, condition.name, DEFAULT_LINE_COLOR);
              const marker_fill = resolveKeyFillColor(
                seriesStyles,
                key.KeyDescription,
                condition.name,
                FIGURE_PATH_COLORS[index_dynamic],
              );
              const marker_stroke = resolveMarkerStroke(marker_fill);
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
                      stroke={line_color}
                    />
                    <Scatter
                      name={key.KeyDescription}
                      data={condition.data}
                      {...noAnimationProps}
                      onDoubleClick={onNavigate}
                      dataKey={`${key.KeyDescription}`}
                      fill={marker_fill}
                      shape={shape}
                      stroke={marker_stroke}
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
                        stroke={line_color}
                      />
                      <Scatter
                        name={key.KeyDescription}
                        data={segment}
                        {...noAnimationProps}
                        onDoubleClick={onNavigate}
                        dataKey={`${key.KeyDescription}`}
                        fill={marker_fill}
                        shape={shape}
                        stroke={marker_stroke}
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

        {seriesStyles.phase_changes.map((phaseChange, index) => (
          <ReferenceLine
            key={`phase-change-${index}`}
            x={phaseChange.position}
            stroke={PHASE_LINE_COLOR}
            strokeWidth={1}
            strokeDasharray={PHASE_LINE_DASH_ARRAY[phaseChange.lineType]}
          />
        ))}

        <TextAnnotationsLayer annotations={seriesStyles.text_annotations} />

        <Tooltip
          {...noAnimationProps}
          animationDuration={100}
          wrapperStyle={{ zIndex: 10 }}
          content={
            <CustomTooltip
              figureTextSize={figureTextSize}
              visibleKeys={visibleKeys}
              hiddenKeysByCondition={hiddenKeysByCondition}
            />
          }
        />

        <Legend {...noAnimationProps} align="center" content={() => <ChartLegendContent payload={legends} />} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
