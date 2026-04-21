import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  checkCrossOriginIsolation,
  displaySharedArrayBufferDiagnostics,
  initializeSharedArrayBufferSupport,
  getSharedArrayBufferConfig,
} from '../shared-buffer.ts';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  group: vi.fn(),
  groupEnd: vi.fn(),
};

/* Mock global objects
const mockGlobals = {
  SharedArrayBuffer: undefined as any,
  Atomics: undefined as any,
  self: { crossOriginIsolated: false } as any,
  navigator: { userAgent: 'Test Browser' } as any,
  window: { isSecureContext: true } as any,
  importMeta: { env: { DEV: false } } as any,
};
*/

describe('shared-buffer.ts', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(mockConsole.log);
    vi.spyOn(console, 'warn').mockImplementation(mockConsole.warn);
    vi.spyOn(console, 'group').mockImplementation(mockConsole.group);
    vi.spyOn(console, 'groupEnd').mockImplementation(mockConsole.groupEnd);

    // Reset global mocks to default state
    (global as any).SharedArrayBuffer = undefined;
    (global as any).Atomics = undefined;
    (global as any).self = { crossOriginIsolated: false };
    (global as any).navigator = { userAgent: 'Test Browser' };
    (global as any).window = { isSecureContext: true, location: { protocol: 'https:' } };

    // Mock import.meta.env
    vi.stubGlobal('import.meta', { env: { DEV: false } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe('checkCrossOriginIsolation', () => {
    it('should return fully supported when SharedArrayBuffer and cross-origin isolation are available', () => {
      // Mock full support
      (global as any).SharedArrayBuffer = class MockSharedArrayBuffer {};
      (global as any).Atomics = { load: vi.fn() };
      (global as any).self = { crossOriginIsolated: true };

      const result = checkCrossOriginIsolation();

      expect(result.isSupported).toBe(true);
      expect(result.isIsolated).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.recommendations).toHaveLength(0);
    });

    it('should detect when SharedArrayBuffer is not available', () => {
      (global as any).SharedArrayBuffer = undefined;
      (global as any).Atomics = undefined;

      const result = checkCrossOriginIsolation();

      expect(result.isSupported).toBe(false);
      expect(result.issues).toContain('SharedArrayBuffer or Atomics not available in this browser');
      expect(result.recommendations).toContain('Try using a modern browser (Chrome 68+, Firefox 79+, Safari 15.2+)');
    });

    it('should detect when cross-origin isolation is not enabled', () => {
      (global as any).SharedArrayBuffer = class MockSharedArrayBuffer {};
      (global as any).Atomics = { load: vi.fn() };
      (global as any).self = { crossOriginIsolated: false };

      const result = checkCrossOriginIsolation();

      expect(result.isSupported).toBe(true);
      expect(result.isIsolated).toBe(false);
      expect(result.issues).toContain('Cross-origin isolation not enabled');
      expect(result.recommendations).toContain('Ensure COOP and COEP headers are properly set on the server');
    });

    it('should detect Firefox HTTPS requirement', () => {
      (global as any).navigator = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
      };
      (global as any).window = { isSecureContext: false };

      const result = checkCrossOriginIsolation();

      expect(result.issues).toContain('Firefox requires HTTPS for SharedArrayBuffer');
      expect(result.recommendations).toContain('Access the application over HTTPS');
    });

    it('should detect Safari cross-origin isolation issues', () => {
      (global as any).navigator = {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Safari/605.1.15',
      };
      (global as any).self = { crossOriginIsolated: false };

      const result = checkCrossOriginIsolation();

      expect(result.issues).toContain('Safari has strict requirements for cross-origin isolation');
      expect(result.recommendations).toContain(
        'Ensure all sub resources have Cross-Origin-Resource-Policy: cross-origin',
      );
    });

    it('should capture user agent information', () => {
      const testUserAgent = 'Mozilla/5.0 (Test Browser)';
      (global as any).navigator = { userAgent: testUserAgent };

      const result = checkCrossOriginIsolation();

      expect(result.userAgent).toBe(testUserAgent);
    });

    it('should handle edge case when both SharedArrayBuffer and Atomics are partially available', () => {
      (global as any).SharedArrayBuffer = class MockSharedArrayBuffer {};
      (global as any).Atomics = undefined; // Only Atomics is missing

      const result = checkCrossOriginIsolation();

      expect(result.isSupported).toBe(false);
      expect(result.issues).toContain('SharedArrayBuffer or Atomics not available in this browser');
    });
  });

  describe('displaySharedArrayBufferDiagnostics', () => {
    it('should log success message when fully supported', () => {
      (global as any).SharedArrayBuffer = class MockSharedArrayBuffer {};
      (global as any).Atomics = { load: vi.fn() };
      (global as any).self = { crossOriginIsolated: true };

      displaySharedArrayBufferDiagnostics();

      expect(mockConsole.log).toHaveBeenCalledWith(
        'SharedArrayBuffer fully supported - high-performance features enabled',
      );
      expect(mockConsole.group).not.toHaveBeenCalled();
    });

    it('should display detailed diagnostics when not fully supported', () => {
      (global as any).SharedArrayBuffer = undefined;
      (global as any).Atomics = undefined;
      (global as any).self = { crossOriginIsolated: false };
      const testUserAgent = 'Test User Agent';
      (global as any).navigator = { userAgent: testUserAgent };

      displaySharedArrayBufferDiagnostics();

      expect(mockConsole.group).toHaveBeenCalledWith('SharedArrayBuffer Diagnostics');
      expect(mockConsole.log).toHaveBeenCalledWith('Support Status:', 'Unavailable');
      expect(mockConsole.log).toHaveBeenCalledWith('Cross-Origin Isolation:', 'Disabled');
      expect(mockConsole.log).toHaveBeenCalledWith('User Agent:', testUserAgent);
      expect(mockConsole.groupEnd).toHaveBeenCalled();
    });

    it('should display issues section when issues exist', () => {
      (global as any).SharedArrayBuffer = undefined;
      (global as any).self = { crossOriginIsolated: false };

      displaySharedArrayBufferDiagnostics();

      expect(mockConsole.group).toHaveBeenCalledWith('Issues Found:');
      expect(mockConsole.log).toHaveBeenCalledWith('• SharedArrayBuffer or Atomics not available in this browser');
      expect(mockConsole.log).toHaveBeenCalledWith('• Cross-origin isolation not enabled');
    });

    it('should display recommendations section when recommendations exist', () => {
      (global as any).SharedArrayBuffer = undefined;
      (global as any).self = { crossOriginIsolated: false };

      displaySharedArrayBufferDiagnostics();

      expect(mockConsole.group).toHaveBeenCalledWith('Recommendations:');
      expect(mockConsole.log).toHaveBeenCalledWith(
        '• Try using a modern browser (Chrome 68+, Firefox 79+, Safari 15.2+)',
      );
      expect(mockConsole.log).toHaveBeenCalledWith('• Ensure COOP and COEP headers are properly set on the server');
    });
  });

  describe('initializeSharedArrayBufferSupport', () => {
    it('should return true when fully supported', () => {
      (global as any).SharedArrayBuffer = class MockSharedArrayBuffer {};
      (global as any).Atomics = { load: vi.fn() };
      (global as any).self = { crossOriginIsolated: true };

      const result = initializeSharedArrayBufferSupport();

      expect(result).toBe(true);
    });

    it('should return false when not supported', () => {
      (global as any).SharedArrayBuffer = undefined;
      (global as any).Atomics = undefined;
      (global as any).self = { crossOriginIsolated: false };

      const result = initializeSharedArrayBufferSupport();

      expect(result).toBe(false);
    });

    it('should display diagnostics in development mode', () => {
      vi.stubGlobal('import.meta', { env: { DEV: true } });
      (global as any).SharedArrayBuffer = undefined;

      const result = initializeSharedArrayBufferSupport();

      expect(mockConsole.group).toHaveBeenCalled(); // Diagnostics displayed
      expect(result).toBe(false);
    });

    it('should not display diagnostics in production mode', () => {
      vi.stubGlobal('import.meta', { env: { DEV: false } });
      (global as any).SharedArrayBuffer = class MockSharedArrayBuffer {};
      (global as any).Atomics = { load: vi.fn() };
      (global as any).self = { crossOriginIsolated: true };

      const result = initializeSharedArrayBufferSupport();

      expect(mockConsole.group).not.toHaveBeenCalled(); // No diagnostics in production when supported
      expect(result).toBe(true);
    });

    it('should display warning when not fully supported', () => {
      (global as any).SharedArrayBuffer = undefined;
      (global as any).self = { crossOriginIsolated: false };

      initializeSharedArrayBufferSupport();

      const expectedMessage = [
        'DataTracker Performance Notice:',
        'High-precision timing features are running in compatibility mode.',
        'For optimal performance, ensure your browser supports SharedArrayBuffer',
        'and that the application is served with proper security headers.',
        '',
        'Contact your system administrator if you continue to see this message.',
      ].join('\n');

      expect(mockConsole.warn).toHaveBeenCalledWith(expectedMessage);
    });

    it('should return false when SharedArrayBuffer is supported but not isolated', () => {
      (global as any).SharedArrayBuffer = class MockSharedArrayBuffer {};
      (global as any).Atomics = { load: vi.fn() };
      (global as any).self = { crossOriginIsolated: false };

      const result = initializeSharedArrayBufferSupport();

      expect(result).toBe(false);
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should return false when isolated but SharedArrayBuffer not supported', () => {
      (global as any).SharedArrayBuffer = undefined;
      (global as any).Atomics = undefined;
      (global as any).self = { crossOriginIsolated: true };

      const result = initializeSharedArrayBufferSupport();

      expect(result).toBe(false);
      expect(mockConsole.warn).toHaveBeenCalled();
    });

    it('should return false and suppress warnings when loaded from file:// origin', () => {
      (global as any).window = { isSecureContext: true, location: { protocol: 'file:' } };
      (global as any).SharedArrayBuffer = class MockSharedArrayBuffer {};
      (global as any).Atomics = { load: vi.fn() };
      (global as any).self = { crossOriginIsolated: false };

      const result = initializeSharedArrayBufferSupport();

      expect(result).toBe(false);
      expect(mockConsole.warn).not.toHaveBeenCalled();
      expect(mockConsole.group).not.toHaveBeenCalled();
    });
  });

  describe('getSharedArrayBufferConfig', () => {
    it('should return optimal config when fully supported', () => {
      (global as any).SharedArrayBuffer = class MockSharedArrayBuffer {};
      (global as any).Atomics = { load: vi.fn() };
      (global as any).self = { crossOriginIsolated: true };

      const config = getSharedArrayBufferConfig();

      expect(config).toEqual({
        enabled: true,
        fallbackMode: false,
        useHighPrecisionTimers: true,
        useMessageChannel: true,
        bufferSize: 64,
        updateFrequency: 50,
      });
    });

    it('should return fallback config when not supported', () => {
      (global as any).SharedArrayBuffer = undefined;
      (global as any).Atomics = undefined;
      (global as any).self = { crossOriginIsolated: false };

      const config = getSharedArrayBufferConfig();

      expect(config).toEqual({
        enabled: false,
        fallbackMode: true,
        useHighPrecisionTimers: false,
        useMessageChannel: true,
        bufferSize: 0,
        updateFrequency: 100,
      });
    });

    it('should return fallback config when SharedArrayBuffer available but not isolated', () => {
      (global as any).SharedArrayBuffer = class MockSharedArrayBuffer {};
      (global as any).Atomics = { load: vi.fn() };
      (global as any).self = { crossOriginIsolated: false };

      const config = getSharedArrayBufferConfig();

      expect(config).toEqual({
        enabled: false,
        fallbackMode: true,
        useHighPrecisionTimers: false,
        useMessageChannel: true,
        bufferSize: 0,
        updateFrequency: 100,
      });
    });

    it('should always enable MessageChannel regardless of SharedArrayBuffer support', () => {
      // Test with no support
      (global as any).SharedArrayBuffer = undefined;
      let config = getSharedArrayBufferConfig();
      expect(config.useMessageChannel).toBe(true);

      // Test with full support
      (global as any).SharedArrayBuffer = class MockSharedArrayBuffer {};
      (global as any).Atomics = { load: vi.fn() };
      (global as any).self = { crossOriginIsolated: true };
      config = getSharedArrayBufferConfig();
      expect(config.useMessageChannel).toBe(true);
    });
  });
});
