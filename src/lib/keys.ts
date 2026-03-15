import { KeySet } from '@/types/keyset';

// This is the type definition for the HumanReadableResults type
export const DEFAULT_ENTRY = {
  KeyName: '',
  KeyDescription: '',
  KeyCode: 0,
};

/**
 * Check if the key is already assigned
 *
 * @param KeySet The current key set
 * @param code The key code
 * @returns true if the key code is already assigned in either FrequencyKeys or DurationKeys, false otherwise
 */
export function is_key_already_assigned(KeySet: KeySet, code: number) {
  return (
    KeySet.FrequencyKeys.find((key) => key.KeyCode === code) || KeySet.DurationKeys.find((key) => key.KeyCode === code)
  );
}

// Check if the key is protected
export const PROTECTED_KEY_ENTRIES = [
  'Z', // Note: Default Timer #1
  'X', // Note: Default Timer #2
  'C', // Note: Default Timer #3
  'V', // TODO: boot to 'last' different schedule (like a 'toggle')
  'Tab',
  'Delete',
  'Shift',
  'Del',
  'Backspace',
  ' ',
  'Space',
];
