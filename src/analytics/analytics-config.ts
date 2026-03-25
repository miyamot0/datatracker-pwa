/**
 * Simple wrapper around env vars for logging/debugging
 */
export const analyticsConfig = {
  enabled: import.meta.env.VITE_ANALYTICS_ENABLED === 'true',

  measurementId: import.meta.env.VITE_G4A_MEASUREMENT_ID,
  apiSecret: import.meta.env.VITE_G4A_SECRET,

  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
};
