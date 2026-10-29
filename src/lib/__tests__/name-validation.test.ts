import { describe, expect, it } from 'vitest';
import { validateNewName } from '../name-validation';

const base = { entityLabel: 'Group', existingNames: ['Alpha', 'Beta'] };

describe('validateNewName', () => {
  it('accepts a usable name', () => {
    expect(validateNewName('Gamma', base)).toBeNull();
  });

  it('rejects names shorter than 4 characters after trimming', () => {
    expect(validateNewName('abc', base)).toBe('Group name must be at least 4 characters long.');
    expect(validateNewName('  abc  ', base)).toBe('Group name must be at least 4 characters long.');
    expect(validateNewName('abcd', base)).toBeNull();
  });

  it('treats existing names case-insensitively and ignores surrounding whitespace', () => {
    expect(validateNewName('ALPHA', base)).toBe('Group already exists.');
    expect(validateNewName('  beta  ', base)).toBe('Group already exists.');
  });

  it('rejects reserved names case-insensitively', () => {
    const options = { ...base, entityLabel: 'KeySet', reservedNames: ['styles', 'styles.json'] };
    expect(validateNewName('Styles', options)).toBe("'Styles' is a reserved name. Choose a different name.");
    expect(validateNewName('STYLES.JSON', options)).toBe("'STYLES.JSON' is a reserved name. Choose a different name.");
  });

  it('guides the user when renaming to the current name', () => {
    expect(validateNewName('Alpha', { ...base, previous: 'alpha' })).toBe('Enter a different name to rename.');
  });

  it('does not treat the previous name as a collision when renaming to a new name', () => {
    expect(validateNewName('Gamma', { ...base, existingNames: ['Alpha', 'Gamma'], previous: 'Gamma' })).toBe(
      'Enter a different name to rename.',
    );
    expect(validateNewName('Delta', { ...base, existingNames: ['Alpha', 'Gamma'], previous: 'Gamma' })).toBeNull();
  });

  it('reports the first failing rule in order: length, rename, reserved, duplicate', () => {
    expect(validateNewName('Ab', { ...base, existingNames: ['Ab'], previous: 'Ab' })).toBe(
      'Group name must be at least 4 characters long.',
    );
    expect(validateNewName('Beta', { ...base, existingNames: ['Beta'], previous: 'Beta' })).toBe(
      'Enter a different name to rename.',
    );
    expect(validateNewName('styles', { ...base, existingNames: ['styles'], reservedNames: ['styles'] })).toBe(
      "'styles' is a reserved name. Choose a different name.",
    );
  });

  it('honors a custom minimum length', () => {
    expect(validateNewName('abc', { ...base, minLength: 3 })).toBeNull();
  });
});
