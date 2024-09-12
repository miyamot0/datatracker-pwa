/**
 * Capitalize the first letter of a string
 *
 * @param str string to clean up
 * @returns
 */
export const CleanUpString = (str: string) => {
  return str.replace(/%20/g, " ");
};
