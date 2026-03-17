/**
 * Get the values of an object
 *
 * @param obj object to get values from
 * @returns An array of the values of the object
 */
export function getValues<T extends Record<string, unknown>>(obj: T) {
  return Object.values(obj) as [(typeof obj)[keyof T]];
}
