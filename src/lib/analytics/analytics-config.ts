/**
 * Simple wrapper around env vars for logging/debugging
 */

// Environment validation with logging for debugging
const validateMeasurementId = (id: string | undefined): string => {
  if (!id) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ GA Measurement ID not provided. Analytics disabled.');
    }
    return '';
  }

  // Allow test values in test environment (when vitest is running)
  const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  const isValidFormat = /^G-[A-Z0-9]{10}$/.test(id);
  const isTestValue = id.startsWith('test-') || id === 'test-measurement-id';

  if (!isValidFormat && !(isTestEnv && isTestValue)) {
    if (import.meta.env.DEV) {
      console.error('❌ Invalid GA Measurement ID format:', id);
      console.log('Expected format: G-XXXXXXXXXX (where X is alphanumeric)');
    }
    return '';
  }

  if (import.meta.env.DEV && !isTestEnv) {
    console.log('✅ Valid GA Measurement ID configured');
  }
  return id;
};

const validateApiSecret = (secret: string | undefined, measurementId: string): string => {
  if (!secret) {
    if (import.meta.env.DEV && measurementId) {
      console.warn('⚠️ GA API Secret not provided. Server-side events disabled.');
    }
    return '';
  }

  // Allow test values in test environment
  const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  const isTestValue = secret.startsWith('test-') || secret === 'test-api-secret';

  // GA4 API secrets are typically 22+ characters
  if (secret.length < 20 && !(isTestEnv && isTestValue)) {
    if (import.meta.env.DEV) {
      console.error('❌ GA API Secret appears invalid (too short)');
    }
    return '';
  }

  return secret;
};

// Centralized environment validation
const measId = validateMeasurementId(import.meta.env.VITE_G4A_MEASUREMENT_ID);
const apiSec = validateApiSecret(import.meta.env.VITE_G4A_SECRET, measId);

export const analyticsConfig = {
  enabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true' && !!measId,

  measurementId: measId,
  apiSecret: apiSec,

  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,

  // Validation status for debugging
  isValid: !!measId && import.meta.env.VITE_ANALYTICS_ENABLED === 'true',
  hasClientTracking: !!measId,
  hasServerTracking: !!measId && !!apiSec,
} as const;
