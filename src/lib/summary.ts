import { PlotPoint } from '@/types/visuals';
import { ModifiedSessionResult } from '@/types/storage';

/**
 * Prepares plot data for session visualization
 *
 * @param relevantSession - The session data to process
 * @returns Array of plot points with time series data
 */
export function preparePlotDataCumulative(relevantSession: ModifiedSessionResult): PlotPoint[] {
  const plot_object: PlotPoint[] = [];
  const keys = relevantSession.Keyset.FrequencyKeys.map((k: { KeyDescription: string }) => k.KeyDescription);

  // Create initial point at time 0
  const start_object: PlotPoint = { second: 0 };
  keys.forEach((k: string) => {
    start_object[k] = 0;
  });
  plot_object.push(start_object);

  // Reference object to track cumulative counts
  const reference_object = { ...start_object };

  // Process each key press to create time series data
  relevantSession.FrequencyKeyPresses.forEach((k: { KeyDescription: string; TimeIntoSession: number }) => {
    // Add point before increment
    const prev: PlotPoint = { second: Math.floor(k.TimeIntoSession) };
    keys.forEach((key: string) => {
      prev[key] = reference_object[key];
    });
    plot_object.push(prev);

    // Increment the specific key
    reference_object[k.KeyDescription] = reference_object[k.KeyDescription] + 1;

    // Add point after increment
    const curr: PlotPoint = { second: Math.floor(k.TimeIntoSession) };
    keys.forEach((key: string) => {
      curr[key] = reference_object[key];
    });
    plot_object.push(curr);
  });

  // Add final point at session end
  const final_object: PlotPoint = {
    ...reference_object,
    second: Math.floor(relevantSession.TimerMain),
  };
  plot_object.push(final_object);

  return plot_object;
}
