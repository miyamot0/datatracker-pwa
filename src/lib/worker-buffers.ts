/**
 * Checks if the current environment supports SharedArrayBuffer, which is essential for high-precision timing and data sharing between the main thread and web workers.
 * @returns {boolean} True if SharedArrayBuffer is supported, false otherwise.
 */
export const isSharedArrayBufferSupported = (): boolean => {
  return (
    typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined' && self.crossOriginIsolated === true
  );
};

// Performance monitoring utilities
export interface PerformanceMetrics {
  keyProcessingTime: number;
  averageLatency: number;
  maxLatency: number;
  missedUpdates: number;
}

// PerformanceMonitor class to track key processing times and missed updates, providing insights into the performance of the session recording process. It maintains a history of latencies to calculate average latency and keeps track of the maximum latency observed. The class also provides methods to record key processing times, missed updates, retrieve current metrics, and reset the metrics when needed. This allows for effective monitoring and optimization of the session recording performance in the application.
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    keyProcessingTime: 0,
    averageLatency: 0,
    maxLatency: 0,
    missedUpdates: 0,
  };

  private latencyHistory: number[] = [];
  private readonly maxHistory = 100;

  /**
   * Records the time taken to process a key event, updating the performance metrics accordingly. It calculates the latency for the key processing and updates the average and maximum latency based on the recorded history.
   * @param startTime The timestamp when the key event processing started.
   * @param endTime The timestamp when the key event processing ended.
   */
  recordKeyProcessing(startTime: number, endTime: number) {
    const latency = endTime - startTime;
    this.latencyHistory.push(latency);

    if (this.latencyHistory.length > this.maxHistory) {
      this.latencyHistory.shift();
    }

    this.metrics.keyProcessingTime = latency;
    this.metrics.maxLatency = Math.max(this.metrics.maxLatency, latency);
    this.metrics.averageLatency = this.latencyHistory.reduce((sum, val) => sum + val, 0) / this.latencyHistory.length;
  }

  /**
   * Records a missed update, incrementing the missed updates counter in the performance metrics.
   */
  recordMissedUpdate() {
    this.metrics.missedUpdates++;
  }

  /**
   * Retrieves the current performance metrics, providing a snapshot of key processing times, average latency, maximum latency, and missed updates.
   * @returns {Readonly<PerformanceMetrics>} The current performance metrics.
   */
  getMetrics(): Readonly<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Resets the performance metrics and latency history.
   */
  reset() {
    this.metrics = {
      keyProcessingTime: 0,
      averageLatency: 0,
      maxLatency: 0,
      missedUpdates: 0,
    };
    this.latencyHistory = [];
  }
}

/**
 * Creates a high-precision timer that executes a callback function at specified intervals with minimal drift. The timer uses `performance.now()` for accurate timing and `setTimeout` with a delay of 0 to achieve the best possible precision. The returned function can be called to stop the timer when it's no longer needed, ensuring efficient resource management.
 *
 * @param callback The function to be executed at each interval.
 * @param interval The interval in milliseconds between each execution of the callback.
 * @returns A function that can be called to stop the timer.
 */
export const createHighPrecisionTimer = (callback: () => void, interval: number): (() => void) => {
  let isRunning = true;
  let startTime = performance.now();
  let nextTick = startTime + interval;

  const tick = () => {
    if (!isRunning) return;

    const currentTime = performance.now();
    if (currentTime >= nextTick) {
      callback();
      nextTick += interval;

      // Drift correction - if we're falling behind, catch up
      if (nextTick < currentTime) {
        nextTick = currentTime + interval;
      }
    }

    // Use setTimeout with 0 delay for maximum timing precision
    setTimeout(tick, 0);
  };

  setTimeout(tick, 0);

  return () => {
    isRunning = false;
  };
};

// Memory-efficient timer state structure for SharedArrayBuffer
export interface SharedTimerState {
  secondsElapsedTotal: number;
  secondsElapsedFirst: number;
  secondsElapsedSecond: number;
  secondsElapsedThird: number;
  secondsElapsedActive: number;

  keyCount: number;
  lastUpdate: number;

  // Note: Using numbers instead of booleans for isRunning and activeTimer to save space in the SharedArrayBuffer
  activeTimer: number; // 0=Stopped, 1=Primary, 2=Secondary, 3=Tertiary
  isRunning: number; // 0=false, 1=true
}

export const SHARED_TIMER_STATE_SIZE = 8 * 8; // 8 float64 values = 64 bytes

/**
 * Creates a SharedArrayBuffer for the timer state, allowing for efficient sharing of timer data between the main thread and web workers.
 * @returns A SharedArrayBuffer for the timer state if supported, or null if SharedArrayBuffer is not supported in the current environment.
 */
export const createSharedTimerBuffer = (): SharedArrayBuffer | null => {
  if (!isSharedArrayBufferSupported()) return null;

  return new SharedArrayBuffer(SHARED_TIMER_STATE_SIZE);
};

/**
 * Creates a Float64Array view of the provided SharedArrayBuffer, allowing for easy access and manipulation of the timer state data.
 * @param buffer The SharedArrayBuffer to create the view from.
 * @returns A Float64Array view of the provided SharedArrayBuffer.
 */
export const getSharedTimerView = (buffer: SharedArrayBuffer): Float64Array => {
  return new Float64Array(buffer);
};
