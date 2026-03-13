import { describe, expect, it } from 'vitest';
import { GenerateSavedFileName } from '../writer';
import { SavedSettings } from '../dtos';

describe('GenerateSavedFileName', () => {
  it('should generate a file name based on the settings', () => {
    const settings: SavedSettings = {
      Therapist: 'John Doe',
      Condition: 'Test Condition',
      KeySet: 'Test KeySet',
      TimerOption: 'End on Timer #1',
      Initials: 'JD',
      Role: 'Primary',
      Session: 1,
      DurationS: 600,
    };
    const fileName = GenerateSavedFileName(settings);
    expect(fileName).toBe('1_Test Condition_Primary.json');
  });
});
