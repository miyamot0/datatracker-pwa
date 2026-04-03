import { SavedSessionResult } from '@/lib/dtos/session-results';

/**
 * Type for modified session results, which extends the base `SavedSessionResult` type by including an additional `Filename` property. This type is used to represent session results that have been modified and saved, allowing for the inclusion of the filename associated with the saved session result. This structure provides a clear and organized way to manage session results along with their corresponding filenames within the application.
 */
export type ModifiedSessionResult = SavedSessionResult & {
  Filename: string;
};
