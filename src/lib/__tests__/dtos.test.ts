import { SavedSettings, toSavedSettings } from '../dtos';
import { SessionDesignerSchemaType } from '../../components/pages/editor-session/session-designer-schema';
import { DataCollectorRolesType } from '@/types/roles';
import { SessionTerminationOptionsType } from '@/types/terminations';

const DEFAULT_KEY_SET = 'asdf';

describe('toSavedSettings', () => {
  it('should correctly convert a session designer schema to saved settings', () => {
    const input: SessionDesignerSchemaType = {
      SessionTherapistID: 'Therapist1',
      DataCollectorID: 'DC1',
      DataCollectorRole: 'Primary',
      SessionDurationS: 1200,
      SessionTerminationOption: 'End on Primary Timer',
      SessionNumber: 2,
      SessionKeySet: DEFAULT_KEY_SET,
      SessionCondition: 'Condition1',
    };

    const expectedOutput: SavedSettings = {
      Therapist: 'Therapist1',
      Initials: 'DC1',
      Role: 'Primary',
      DurationS: 1200,
      TimerOption: 'End on Primary Timer',
      Session: 2,
      KeySet: DEFAULT_KEY_SET,
      Condition: 'Condition1',
    };

    const result = toSavedSettings(input);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle empty or default values in the session designer schema', () => {
    const input: SessionDesignerSchemaType = {
      SessionTherapistID: '',
      DataCollectorID: '',
      DataCollectorRole: 'Reliability' as DataCollectorRolesType,
      SessionDurationS: 0,
      SessionTerminationOption: 'End on Timer #1' as SessionTerminationOptionsType,
      SessionNumber: 1,
      SessionKeySet: DEFAULT_KEY_SET,
      SessionCondition: '',
    };

    const expectedOutput: SavedSettings = {
      Therapist: '',
      Initials: '',
      Role: 'Reliability',
      DurationS: 0,
      TimerOption: 'End on Timer #1',
      Session: 1,
      KeySet: DEFAULT_KEY_SET,
      Condition: '',
    };

    const result = toSavedSettings(input);
    expect(result).toEqual(expectedOutput);
  });

  it('should return the default session settings for incomplete input', () => {
    const input: Partial<SessionDesignerSchemaType> = {
      SessionTherapistID: 'Therapist2',
      DataCollectorID: '',
      DataCollectorRole: 'Primary',
      SessionDurationS: 600,
      SessionTerminationOption: 'End on Primary Timer',
      SessionNumber: 1,
      SessionKeySet: DEFAULT_KEY_SET,
      SessionCondition: '',
    };

    const expectedOutput: SavedSettings = {
      Therapist: 'Therapist2',
      Initials: '',
      Role: 'Primary',
      DurationS: 600,
      TimerOption: 'End on Primary Timer',
      Session: 1,
      KeySet: DEFAULT_KEY_SET,
      Condition: '',
    } satisfies SavedSettings;

    const result = toSavedSettings(input as SessionDesignerSchemaType);
    expect(result).toEqual(expectedOutput);
  });

  it('should correctly handle a different DataCollectorRole', () => {
    const input: SessionDesignerSchemaType = {
      SessionTherapistID: 'Therapist3',
      DataCollectorID: 'DC2',
      DataCollectorRole: 'Reliability',
      SessionDurationS: 1800,
      SessionTerminationOption: 'End on Primary Timer',
      SessionNumber: 3,
      SessionKeySet: DEFAULT_KEY_SET,
      SessionCondition: 'Condition3',
    };

    const expectedOutput: SavedSettings = {
      Therapist: 'Therapist3',
      Initials: 'DC2',
      Role: 'Reliability',
      DurationS: 1800,
      TimerOption: 'End on Primary Timer',
      Session: 3,
      KeySet: DEFAULT_KEY_SET,
      Condition: 'Condition3',
    };

    const result = toSavedSettings(input);
    expect(result).toEqual(expectedOutput);
  });

  it('Should correctly return string and custom objects for SessionTerminationOption', () => {
    const input: SessionDesignerSchemaType = {
      SessionTherapistID: 'Therapist4',
      DataCollectorID: 'DC3',
      DataCollectorRole: 'Primary',
      SessionDurationS: 900,
      SessionTerminationOption: 'End on Timer #2',
      SessionNumber: 4,
      SessionKeySet: DEFAULT_KEY_SET,
      SessionCondition: 'Condition4',
    };

    const expectedOutput: SavedSettings = {
      Therapist: 'Therapist4',
      Initials: 'DC3',
      Role: 'Primary',
      DurationS: 900,
      TimerOption: 'End on Timer #2',
      Session: 4,
      KeySet: DEFAULT_KEY_SET,
      Condition: 'Condition4',
    };

    const result = toSavedSettings(input);
    expect(result).toEqual(expectedOutput);

    const input3: SessionDesignerSchemaType = {
      SessionTherapistID: 'Therapist4',
      DataCollectorID: 'DC3',
      DataCollectorRole: 'Primary',
      SessionDurationS: 900,
      SessionTerminationOption: 'End on Timer #3',
      SessionNumber: 4,
      SessionKeySet: DEFAULT_KEY_SET,
      SessionCondition: 'Condition4',
    };

    const expectedOutput3: SavedSettings = {
      Therapist: 'Therapist4',
      Initials: 'DC3',
      Role: 'Primary',
      DurationS: 900,
      TimerOption: 'End on Timer #3',
      Session: 4,
      KeySet: DEFAULT_KEY_SET,
      Condition: 'Condition4',
    };

    const result3 = toSavedSettings(input3);
    expect(result3).toEqual(expectedOutput3);

    const inputTotal: SessionDesignerSchemaType = {
      SessionTherapistID: 'Therapist4',
      DataCollectorID: 'DC3',
      DataCollectorRole: 'Primary',
      SessionDurationS: 900,
      SessionTerminationOption: 'End on Total Time',
      SessionNumber: 4,
      SessionKeySet: DEFAULT_KEY_SET,
      SessionCondition: 'Condition4',
    };

    const expectedOutputTotal: SavedSettings = {
      Therapist: 'Therapist4',
      Initials: 'DC3',
      Role: 'Primary',
      DurationS: 900,
      TimerOption: 'End on Primary Timer', // Should map 'End on Total Time' to 'End on Primary Timer'
      Session: 4,
      KeySet: DEFAULT_KEY_SET,
      Condition: 'Condition4',
    };

    const resultTotal = toSavedSettings(inputTotal);
    expect(resultTotal).toEqual(expectedOutputTotal);

    // Test with a custom numeric option
    const customInput: SessionDesignerSchemaType = {
      SessionTherapistID: 'Therapist5',
      DataCollectorID: 'DC4',
      DataCollectorRole: 'Primary',
      SessionDurationS: 900,
      SessionTerminationOption: '300', // Custom numeric option as string
      SessionNumber: 5,
      SessionKeySet: DEFAULT_KEY_SET,
      SessionCondition: 'Condition5',
    };

    const customExpectedOutput: SavedSettings = {
      Therapist: 'Therapist5',
      Initials: 'DC4',
      Role: 'Primary',
      DurationS: 900,
      TimerOption: 300, // Should be converted to number
      Session: 5,
      KeySet: DEFAULT_KEY_SET,
      Condition: 'Condition5',
    };

    const customResult = toSavedSettings(customInput);
    expect(customResult).toEqual(customExpectedOutput);

    // Test with an invalid option
    const invalidInput: SessionDesignerSchemaType = {
      SessionTherapistID: 'Therapist6',
      DataCollectorID: 'DC5',
      DataCollectorRole: 'Primary',
      SessionDurationS: 900,
      SessionTerminationOption: 'Invalid Option',
      SessionNumber: 6,
      SessionKeySet: DEFAULT_KEY_SET,
      SessionCondition: 'Condition6',
    };

    expect(() => toSavedSettings(invalidInput)).toThrowError('Invalid session termination option: Invalid Option');
  });
});
