/**
 * Correct URL-encoded spaces in a string by replacing '%20' with actual spaces. This is useful for cleaning up strings that may have been URL-encoded, ensuring they are more readable and user-friendly.
 *
 * @param str string to clean up
 * @returns A sanitized string without URL encoding
 */
export const CleanUpString = (str: string) => {
  return str.replace(/%20/g, ' ');
};
