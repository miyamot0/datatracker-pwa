import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isSharedArrayBufferSupported,
  PerformanceMonitor,
  createHighPrecisionTimer,
  createSharedTimerBuffer,
  getSharedTimerView,
  SHARED_TIMER_STATE_SIZE,
  type PerformanceMetrics,
  type SharedTimerState,
} from '../worker-buffers';

// Mock global environment
const mockGlobal = globalThis as any;

describe('worker-buffers', () => {
  describe('isSharedArrayBufferSupported', () => {
    let originalSharedArrayBuffer: any;
    let originalAtomics: any;
    let originalCrossOriginIsolated: any;

    beforeEach(() => {
      // Store original values
      originalSharedArrayBuffer = mockGlobal.SharedArrayBuffer;
      originalAtomics = mockGlobal.Atomics;
      originalCrossOriginIsolated = mockGlobal.self?.crossOriginIsolated;
    });

    afterEach(() => {
      // Restore original values
      mockGlobal.SharedArrayBuffer = originalSharedArrayBuffer;
      mockGlobal.Atomics = originalAtomics;
      if (mockGlobal.self) {
        mockGlobal.self.crossOriginIsolated = originalCrossOriginIsolated;
      }
    });

    it('should return true when all requirements are met', () => {
      // Mock all requirements as available
      mockGlobal.SharedArrayBuffer = class MockSharedArrayBuffer {};
      mockGlobal.Atomics = {};
      mockGlobal.self = { crossOriginIsolated: true };

      expect(isSharedArrayBufferSupported()).toBe(true);
    });

    it('should return false when SharedArrayBuffer is undefined', () => {
      mockGlobal.SharedArrayBuffer = undefined;
      mockGlobal.Atomics = {};
      mockGlobal.self = { crossOriginIsolated: true };

      expect(isSharedArrayBufferSupported()).toBe(false);
    });

    it('should return false when Atomics is undefined', () => {
      mockGlobal.SharedArrayBuffer = class MockSharedArrayBuffer {};
      mockGlobal.Atomics = undefined;
      mockGlobal.self = { crossOriginIsolated: true };

      expect(isSharedArrayBufferSupported()).toBe(false);
    });

    it('should return false when crossOriginIsolated is false', () => {
      mockGlobal.SharedArrayBuffer = class MockSharedArrayBuffer {};
      mockGlobal.Atomics = {};
      mockGlobal.self = { crossOriginIsolated: false };

      expect(isSharedArrayBufferSupported()).toBe(false);
    });

    it('should return false when crossOriginIsolated is undefined', () => {
      mockGlobal.SharedArrayBuffer = class MockSharedArrayBuffer {};
      mockGlobal.Atomics = {};
      mockGlobal.self = { crossOriginIsolated: undefined };

      expect(isSharedArrayBufferSupported()).toBe(false);
    });
  });

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor();
    });

    describe('initial state', () => {
      it('should start with default metrics', () => {
        const metrics = monitor.getMetrics();
        expect(metrics).toEqual({
          keyProcessingTime: 0,
          averageLatency: 0,
          maxLatency: 0,
          missedUpdates: 0,
        });
      });

      it('should return a copy of metrics, not the original object', () => {
        const metrics1 = monitor.getMetrics();
        const metrics2 = monitor.getMetrics();

        expect(metrics1).not.toBe(metrics2);
        expect(metrics1).toEqual(metrics2);
      });
    });

    describe('recordKeyProcessing', () => {
      it('should record a single key processing time', () => {
        monitor.recordKeyProcessing(100, 105);

        const metrics = monitor.getMetrics();
        expect(metrics.keyProcessingTime).toBe(5);
        expect(metrics.averageLatency).toBe(5);
        expect(metrics.maxLatency).toBe(5);
        expect(metrics.missedUpdates).toBe(0);
      });

      it('should update average latency with multiple recordings', () => {
        monitor.recordKeyProcessing(100, 105); // 5ms
        monitor.recordKeyProcessing(200, 203); // 3ms
        monitor.recordKeyProcessing(300, 308); // 8ms

        const metrics = monitor.getMetrics();
        expect(metrics.keyProcessingTime).toBe(8); // Last recorded
        expect(metrics.averageLatency).toBeCloseTo(5.33, 2); // (5+3+8)/3
        expect(metrics.maxLatency).toBe(8);
      });

      it('should track maximum latency correctly', () => {
        monitor.recordKeyProcessing(100, 105); // 5ms
        monitor.recordKeyProcessing(200, 215); // 15ms - new max
        monitor.recordKeyProcessing(300, 302); // 2ms - smaller than max

        const metrics = monitor.getMetrics();
        expect(metrics.maxLatency).toBe(15);
      });

      it('should handle zero latency', () => {
        monitor.recordKeyProcessing(100, 100);

        const metrics = monitor.getMetrics();
        expect(metrics.keyProcessingTime).toBe(0);
        expect(metrics.averageLatency).toBe(0);
        expect(metrics.maxLatency).toBe(0);
      });

      it('should handle negative latency (edge case)', () => {
        monitor.recordKeyProcessing(100, 95);

        const metrics = monitor.getMetrics();
        expect(metrics.keyProcessingTime).toBe(-5);
        expect(metrics.averageLatency).toBe(-5);
        // Math.max will return 0 for negative values when starting from 0
        expect(metrics.maxLatency).toBe(0);
      });

      it('should maintain history limit of 100 entries', () => {
        // Record 150 entries (50 more than the limit)
        for (let i = 0; i < 150; i++) {
          monitor.recordKeyProcessing(i * 100, i * 100 + i + 1); // Latency = i + 1
        }

        const metrics = monitor.getMetrics();
        // Average should only include last 100 entries (latencies 51-150)
        // Sum of 51 to 150 = (sum of 1 to 150) - (sum of 1 to 50) = 11325 - 1275 = 10050
        // Average = 10050 / 100 = 100.5
        expect(metrics.averageLatency).toBeCloseTo(100.5, 1);
      });
    });

    describe('recordMissedUpdate', () => {
      it('should increment missed updates counter', () => {
        monitor.recordMissedUpdate();

        const metrics = monitor.getMetrics();
        expect(metrics.missedUpdates).toBe(1);
      });

      it('should increment multiple times', () => {
        monitor.recordMissedUpdate();
        monitor.recordMissedUpdate();
        monitor.recordMissedUpdate();

        const metrics = monitor.getMetrics();
        expect(metrics.missedUpdates).toBe(3);
      });
    });

    describe('reset', () => {
      it('should reset all metrics to initial state', () => {
        // Set up some data
        monitor.recordKeyProcessing(100, 110);
        monitor.recordKeyProcessing(200, 220);
        monitor.recordMissedUpdate();
        monitor.recordMissedUpdate();

        // Verify data exists
        let metrics = monitor.getMetrics();
        expect(metrics.keyProcessingTime).toBe(20);
        expect(metrics.averageLatency).toBe(15);
        expect(metrics.maxLatency).toBe(20);
        expect(metrics.missedUpdates).toBe(2);

        // Reset and verify
        monitor.reset();
        metrics = monitor.getMetrics();
        expect(metrics).toEqual({
          keyProcessingTime: 0,
          averageLatency: 0,
          maxLatency: 0,
          missedUpdates: 0,
        });
      });

      it('should reset latency history', () => {
        // Record some entries
        monitor.recordKeyProcessing(100, 110);
        monitor.recordKeyProcessing(200, 220);

        monitor.reset();

        // Recording a new entry should show it as the only entry in average
        monitor.recordKeyProcessing(300, 305);
        const metrics = monitor.getMetrics();
        expect(metrics.averageLatency).toBe(5); // Only the new entry
      });
    });
  });

  describe('createHighPrecisionTimer', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.spyOn(performance, 'now');
    });

    afterEach(() => {
      vi.useRealTimers();
      vi.clearAllMocks();
    });

    it('should create a timer that calls callback at specified intervals', () => {
      const callback = vi.fn();
      const interval = 50;

      // Mock performance.now to return predictable values
      let currentTime = 0;
      vi.mocked(performance.now).mockImplementation(() => currentTime);

      const stopTimer = createHighPrecisionTimer(callback, interval);

      // Fast forward through several intervals
      currentTime = 25;
      vi.runOnlyPendingTimers();
      expect(callback).not.toHaveBeenCalled(); // Too early

      currentTime = 50;
      vi.runOnlyPendingTimers();
      expect(callback).toHaveBeenCalledTimes(1);

      currentTime = 100;
      vi.runOnlyPendingTimers();
      expect(callback).toHaveBeenCalledTimes(2);

      currentTime = 150;
      vi.runOnlyPendingTimers();
      expect(callback).toHaveBeenCalledTimes(3);

      stopTimer();
    });

    it('should stop timer when stop function is called', () => {
      const callback = vi.fn();
      let currentTime = 0;
      vi.mocked(performance.now).mockImplementation(() => currentTime);

      const stopTimer = createHighPrecisionTimer(callback, 50);

      currentTime = 50;
      vi.runOnlyPendingTimers();
      expect(callback).toHaveBeenCalledTimes(1);

      // Stop the timer
      stopTimer();

      // Advance time and run timers - callback should not be called again
      currentTime = 100;
      vi.runOnlyPendingTimers();
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should handle drift correction', () => {
      const callback = vi.fn();
      let currentTime = 0;
      vi.mocked(performance.now).mockImplementation(() => currentTime);

      const stopTimer = createHighPrecisionTimer(callback, 50);

      // Simulate falling behind (timer should have fired at 50, but we're at 75)
      currentTime = 75;
      vi.runOnlyPendingTimers();
      expect(callback).toHaveBeenCalledTimes(1);

      // Next tick should be corrected to current time + interval (75 + 50 = 125)
      currentTime = 125;
      vi.runOnlyPendingTimers();
      expect(callback).toHaveBeenCalledTimes(2);

      stopTimer();
    });

    it('should handle multiple callbacks in catch-up scenarios', () => {
      const callback = vi.fn();
      let currentTime = 0;
      vi.mocked(performance.now).mockImplementation(() => currentTime);

      const stopTimer = createHighPrecisionTimer(callback, 50);

      // Jump ahead by multiple intervals at once
      currentTime = 150; // Should trigger 3 callbacks (at 50, 100, 150)
      vi.runOnlyPendingTimers();

      // Due to drift correction, only one callback should fire and reset the next tick
      expect(callback).toHaveBeenCalledTimes(1);

      stopTimer();
    });
  });

  describe('createSharedTimerBuffer', () => {
    beforeEach(() => {
      // Reset SharedArrayBuffer mock
      mockGlobal.SharedArrayBuffer = undefined;
      mockGlobal.Atomics = undefined;
      mockGlobal.self = { crossOriginIsolated: false };
    });

    it('should return null when SharedArrayBuffer is not supported', () => {
      const buffer = createSharedTimerBuffer();
      expect(buffer).toBe(null);
    });

    it('should create SharedArrayBuffer when supported', () => {
      // Mock SharedArrayBuffer support
      const mockBuffer = { byteLength: SHARED_TIMER_STATE_SIZE };
      const MockSharedArrayBuffer = vi.fn(() => mockBuffer);

      mockGlobal.SharedArrayBuffer = MockSharedArrayBuffer;
      mockGlobal.Atomics = {};
      mockGlobal.self = { crossOriginIsolated: true };

      const buffer = createSharedTimerBuffer();

      expect(MockSharedArrayBuffer).toHaveBeenCalledWith(SHARED_TIMER_STATE_SIZE);
      expect(buffer).toBe(mockBuffer);
    });

    it('should create buffer with correct size', () => {
      const MockSharedArrayBuffer = vi.fn();
      mockGlobal.SharedArrayBuffer = MockSharedArrayBuffer;
      mockGlobal.Atomics = {};
      mockGlobal.self = { crossOriginIsolated: true };

      createSharedTimerBuffer();

      expect(MockSharedArrayBuffer).toHaveBeenCalledWith(64); // 8 * 8 = 64 bytes
    });
  });

  describe('getSharedTimerView', () => {
    it('should create Float64Array view of SharedArrayBuffer', () => {
      const mockBuffer = { byteLength: SHARED_TIMER_STATE_SIZE };
      const mockView = new Float64Array(8);

      const MockFloat64Array = vi.fn(() => mockView);
      const originalFloat64Array = globalThis.Float64Array;
      globalThis.Float64Array = MockFloat64Array as any;

      try {
        const view = getSharedTimerView(mockBuffer as SharedArrayBuffer);

        expect(MockFloat64Array).toHaveBeenCalledWith(mockBuffer);
        expect(view).toBe(mockView);
      } finally {
        globalThis.Float64Array = originalFloat64Array;
      }
    });
  });

  describe('Constants', () => {
    it('should have correct SHARED_TIMER_STATE_SIZE', () => {
      expect(SHARED_TIMER_STATE_SIZE).toBe(64); // 8 fields * 8 bytes per Float64
    });
  });

  describe('Interfaces', () => {
    it('should support PerformanceMetrics interface', () => {
      const metrics: PerformanceMetrics = {
        keyProcessingTime: 1.5,
        averageLatency: 2.3,
        maxLatency: 5.7,
        missedUpdates: 3,
      };

      expect(metrics.keyProcessingTime).toBe(1.5);
      expect(metrics.averageLatency).toBe(2.3);
      expect(metrics.maxLatency).toBe(5.7);
      expect(metrics.missedUpdates).toBe(3);
    });

    it('should support SharedTimerState interface', () => {
      const timerState: SharedTimerState = {
        secondsElapsedTotal: 10.5,
        secondsElapsedFirst: 5.2,
        secondsElapsedSecond: 3.1,
        secondsElapsedThird: 2.2,
        secondsElapsedActive: 1.8,
        keyCount: 25,
        lastUpdate: 1234567890,
        activeTimer: 1, // Primary
        isRunning: 1, // true
      };

      expect(timerState.secondsElapsedTotal).toBe(10.5);
      expect(timerState.activeTimer).toBe(1);
      expect(timerState.isRunning).toBe(1);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    describe('PerformanceMonitor edge cases', () => {
      it('should handle very large latency values', () => {
        const monitor = new PerformanceMonitor();
        monitor.recordKeyProcessing(0, Number.MAX_SAFE_INTEGER);

        const metrics = monitor.getMetrics();
        expect(metrics.keyProcessingTime).toBe(Number.MAX_SAFE_INTEGER);
        expect(metrics.maxLatency).toBe(Number.MAX_SAFE_INTEGER);
      });

      it('should handle floating point latency values', () => {
        const monitor = new PerformanceMonitor();
        monitor.recordKeyProcessing(100.123, 100.456);

        const metrics = monitor.getMetrics();
        expect(metrics.keyProcessingTime).toBeCloseTo(0.333, 3);
        expect(metrics.averageLatency).toBeCloseTo(0.333, 3);
      });
    });

    describe('createHighPrecisionTimer edge cases', () => {
      beforeEach(() => {
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should handle very small intervals', () => {
        const callback = vi.fn();
        let currentTime = 0;
        vi.spyOn(performance, 'now').mockImplementation(() => currentTime);

        const stopTimer = createHighPrecisionTimer(callback, 0.1);

        currentTime = 0.1;
        vi.runOnlyPendingTimers();
        expect(callback).toHaveBeenCalledTimes(1);

        stopTimer();
      });

      it('should handle zero interval', () => {
        const callback = vi.fn();
        let currentTime = 0;
        vi.spyOn(performance, 'now').mockImplementation(() => currentTime);

        const stopTimer = createHighPrecisionTimer(callback, 0);

        currentTime = 0;
        vi.runOnlyPendingTimers();
        expect(callback).toHaveBeenCalledTimes(1);

        stopTimer();
      });
    });
  });
});
