/**
 * @deprecated This barrel file will be removed in a future version.
 *
 * Use focused imports instead:
 * - `@/lib/graphing/session-filters` for filterSessionsByPrimaryRole, filterSessionsByReliabilityRole, getUniqueSessionConditions
 * - `@/lib/graphing/chart-setup` for generateTicks, createChartLegends, getChartConfiguration, createNavigationHandler
 * - `@/lib/graphing/data-preparation` for generateChartPreparation, calculateSplitPoints, prepareProportionDataUniversal, prepareRateDataUniversal
 * - `@/lib/graphing/keyset-utils` for extractAndDeduplicateKeysets, mapKeysWithStoragePreference
 *
 * This provides better tree-shaking and bundle optimization.
 */

// Session filtering utilities
export {
  filterSessionsByPrimaryRole,
  filterSessionsByReliabilityRole,
  getUniqueSessionConditions,
} from './graphing/session-filters';

// Chart setup and configuration utilities
export {
  generateTicks,
  createChartLegends,
  getChartConfiguration,
  createNavigationHandler,
} from './graphing/chart-setup';

// Data preparation utilities
export {
  generateChartPreparation,
  calculateSplitPoints,
  prepareProportionDataUniversal,
  prepareRateDataUniversal,
} from './graphing/data-preparation';

// Keyset processing utilities
export { extractAndDeduplicateKeysets, mapKeysWithStoragePreference } from './graphing/keyset-utils';
