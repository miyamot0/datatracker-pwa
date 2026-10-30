import { describe, it, expect } from 'vitest';
import { DEFAULT_SESSION_SETTINGS, SavedSettingsSchema } from '../dtos/session-settings';

describe('SavedSettingsSchema', () => {
  it('returns defaults for an empty object', () => {
    expect(SavedSettingsSchema.parse({})).toMatchObject(DEFAULT_SESSION_SETTINGS);
  });

  it('falls back per field and keeps the valid fields', () => {
    const parsed = SavedSettingsSchema.parse({
      Therapist: 'T1',
      Session: 'not-a-number',
      Role: 'Nonsense',
      DurationS: 300,
    });

    expect(parsed.Therapist).toBe('T1');
    expect(parsed.DurationS).toBe(300);
    expect(parsed.Session).toBe(DEFAULT_SESSION_SETTINGS.Session);
    expect(parsed.Role).toBe(DEFAULT_SESSION_SETTINGS.Role);
  });

  it('keeps unknown keys', () => {
    const parsed = SavedSettingsSchema.parse({ Therapist: 'T1', CustomFlag: true });

    expect(parsed).toHaveProperty('CustomFlag', true);
  });

  it('accepts a numeric timer option and falls back on an invalid one', () => {
    expect(SavedSettingsSchema.parse({ TimerOption: 42 }).TimerOption).toBe(42);
    expect(SavedSettingsSchema.parse({ TimerOption: { bad: true } }).TimerOption).toBe(
      DEFAULT_SESSION_SETTINGS.TimerOption,
    );
  });
});
