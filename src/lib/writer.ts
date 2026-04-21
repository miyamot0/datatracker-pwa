import { SavedSettings } from './dtos';

/**
 * Generate a saved file name
 *
 * @param Settings The settings to generate the file name from
 */
export function GenerateSavedFileName(Settings: SavedSettings) {
  return `${Settings.Session}_${Settings.Condition}_${Settings.Role}.json`;
}
