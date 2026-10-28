/**
 * File name used to store saved figure styles (localStorage style state) inside an evaluation folder.
 * It is a reserved name: scanners skip it, and keysets/sessions can never be created with it.
 */
export const RESERVED_STYLES_FILE_NAME = 'styles.json';

/**
 * Returns true when a file name is the reserved styles file (case-insensitive).
 */
export function isReservedFileName(name: string): boolean {
  return name.trim().toLowerCase() === RESERVED_STYLES_FILE_NAME;
}

/**
 * Returns true when a keyset name would collide with the reserved styles file once stored as `<name>.json`.
 */
export function isReservedKeysetName(name: string): boolean {
  const normalized = name.trim().toLowerCase();

  return normalized === 'styles' || normalized === RESERVED_STYLES_FILE_NAME;
}
