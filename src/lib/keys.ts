import { KeySet } from "@/types/keyset";

// This is the type definition for the HumanReadableResults type
export const DEFAULT_ENTRY = {
  KeyName: "",
  KeyDescription: "",
  KeyCode: 0,
};

/**
 * Check if the key is already assigned
 *
 * @param KeySet The current key set
 * @param code The key code
 * @returns
 */
export function is_key_already_assigned(KeySet: KeySet, code: number) {
  return (
    KeySet.FrequencyKeys.find((key) => key.KeyCode === code) ||
    KeySet.DurationKeys.find((key) => key.KeyCode === code)
  );
}

// Check if the key is protected
export const PROTECTED_KEY_ENTRIES = [
  "Z",
  "X",
  "C",
  "Tab",
  "Delete",
  "Shift",
  "Del",
  "Backspace",
  " ",
  "Space",
];
