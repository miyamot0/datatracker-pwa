/**
 * Defines the types for visualizations in the application.
 */
export type PlotPoint = {
  second: number;
  [keyDescription: string]: number;
};

/**
 * Extended plot point type that includes the condition for tooltip purposes
 */
export type ExtendedPlotPoint = PlotPoint & {
  Condition: string;
};

/**
 * Type definition for individual payload entries in the tooltip
 */
export type TooltipPayloadEntry = {
  value: number;
  name: string;
  dataKey: string | number;
  payload: ExtendedPlotPoint;
  color?: string;
  fill?: string;
};

/**
 * Type definition for custom tooltip props
 */
export type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string | number;
};

/**
 * Type definition for keys with visibility toggling in visualizations, used for user preferences and dynamic display handling
 */
export type ToggleDisplayKey = {
  KeyDescription: string;
  Visible: boolean;
};
