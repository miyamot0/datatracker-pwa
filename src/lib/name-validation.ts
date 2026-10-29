const MIN_NAME_LENGTH = 4;

export type NameValidationOptions = {
  /** Human-readable noun used in messages, e.g. "Group" */
  entityLabel: string;
  existingNames: readonly string[];
  reservedNames?: readonly string[];
  /** Current name when renaming; it is not treated as a collision */
  previous?: string;
  minLength?: number;
};

/**
 * Validates a proposed folder/record name. Returns the first failing message, or null when the name is usable.
 * Comparisons are trimmed and case-insensitive, since macOS and Windows folders are case-insensitive.
 */
export function validateNewName(name: string, options: NameValidationOptions): string | null {
  const { entityLabel, existingNames, reservedNames = [], previous, minLength = MIN_NAME_LENGTH } = options;
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();

  if (trimmed.length < minLength) {
    return `${entityLabel} name must be at least ${minLength} characters long.`;
  }

  if (previous !== undefined && lower === previous.trim().toLowerCase()) {
    return 'Enter a different name to rename.';
  }

  if (reservedNames.some((reserved) => reserved.toLowerCase() === lower)) {
    return `'${trimmed}' is a reserved name. Choose a different name.`;
  }

  if (existingNames.some((existing) => existing.trim().toLowerCase() === lower)) {
    return `${entityLabel} already exists.`;
  }

  return null;
}
