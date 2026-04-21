/**
 * Shared Buffer Support and Cross-Origin Isolation Check
 */
export interface CrossOriginIsolationCheck {
  isSupported: boolean;
  isIsolated: boolean;
  userAgent: string;
  issues: string[];
  recommendations: string[];
}

/**
 * Comprehensive check for SharedArrayBuffer support and cross-origin isolation
 */
export const checkCrossOriginIsolation = (): CrossOriginIsolationCheck => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  const isSupported = typeof SharedArrayBuffer !== 'undefined' && typeof Atomics !== 'undefined';
  const isIsolated = self.crossOriginIsolated === true;

  if (!isSupported) {
    issues.push('SharedArrayBuffer or Atomics not available in this browser');
    recommendations.push('Try using a modern browser (Chrome 68+, Firefox 79+, Safari 15.2+)');
  }

  if (!isIsolated) {
    issues.push('Cross-origin isolation not enabled');
    recommendations.push('Ensure COOP and COEP headers are properly set on the server');
    recommendations.push('Check that all resources are served with proper CORS headers');
  }

  // Check for specific browser limitations
  const userAgent = navigator.userAgent;

  if (userAgent.includes('Firefox') && !window.isSecureContext) {
    issues.push('Firefox requires HTTPS for SharedArrayBuffer');
    recommendations.push('Access the application over HTTPS');
  }

  if (userAgent.includes('Safari') && !isIsolated) {
    issues.push('Safari has strict requirements for cross-origin isolation');
    recommendations.push('Ensure all sub resources have Cross-Origin-Resource-Policy: cross-origin');
  }

  return {
    isSupported,
    isIsolated,
    userAgent,
    issues,
    recommendations,
  };
};

/**
 * Display user-friendly diagnostic information about SharedArrayBuffer support
 */
export const displaySharedArrayBufferDiagnostics = (): void => {
  const check = checkCrossOriginIsolation();

  if (check.isSupported && check.isIsolated) {
    console.log('SharedArrayBuffer fully supported - high-performance features enabled');
    return;
  }

  console.group('SharedArrayBuffer Diagnostics');
  console.log('Support Status:', check.isSupported ? 'Available' : 'Unavailable');
  console.log('Cross-Origin Isolation:', check.isIsolated ? 'Enabled' : 'Disabled');
  console.log('User Agent:', check.userAgent);

  if (check.issues.length > 0) {
    console.group('Issues Found:');
    check.issues.forEach((issue) => console.log(`• ${issue}`));
    console.groupEnd();
  }

  if (check.recommendations.length > 0) {
    console.group('Recommendations:');
    check.recommendations.forEach((rec) => console.log(`• ${rec}`));
    console.groupEnd();
  }

  console.groupEnd();
};

/**
 * Initialize SharedArrayBuffer support check on app startup
 */
export const initializeSharedArrayBufferSupport = (): boolean => {
  // When loaded from a file:// origin (e.g. island/offline mode) there is no
  // server to supply COOP/COEP headers, so cross-origin isolation is structurally
  // impossible and SharedArrayBuffer cannot be used. Suppress the warning and
  // return false so callers fall back to compatibility mode.
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return false;
  }

  const check = checkCrossOriginIsolation();

  // Always display diagnostics in development
  if (import.meta.env.DEV) {
    displaySharedArrayBufferDiagnostics();
  }

  // Display user notification if SharedArrayBuffer isn't fully supported
  if (!check.isSupported || !check.isIsolated) {
    const message = [
      'DataTracker Performance Notice:',
      'High-precision timing features are running in compatibility mode.',
      'For optimal performance, ensure your browser supports SharedArrayBuffer',
      'and that the application is served with proper security headers.',
      '',
      'Contact your system administrator if you continue to see this message.',
    ].join('\n');

    console.warn(message);

    // Optional: Show user-facing notification (uncomment if needed)
    // if ('Notification' in window && Notification.permission === 'granted') {
    //   new Notification('DataTracker Performance', {
    //     body: 'Running in compatibility mode. High-precision features may be limited.',
    //     icon: '/icon-192.png'
    //   });
    // }
  }

  return check.isSupported && check.isIsolated;
};

/**
 * Environment-specific configuration for SharedArrayBuffer
 */
export const getSharedArrayBufferConfig = () => {
  const { isSupported, isIsolated } = checkCrossOriginIsolation();

  return {
    enabled: isSupported && isIsolated,
    fallbackMode: !isSupported || !isIsolated,
    useHighPrecisionTimers: isSupported && isIsolated,
    useMessageChannel: true, // Always available
    bufferSize: isSupported && isIsolated ? 64 : 0, // Full buffer or no buffer
    updateFrequency: isSupported && isIsolated ? 50 : 100, // Higher precision when available
  };
};
