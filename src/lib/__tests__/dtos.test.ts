import { SavedSettings, toSavedSettings } from '../dtos';
import {
  DataCollectorRolesType,
  SessionDesignerSchemaType,
  SessionTerminationOptionsType,
} from '../../forms/schema/session-designer-schema';

describe('toSavedSettings', () => {
  it('should correctly convert a session designer schema to saved settings', () => {
    const input: SessionDesignerSchemaType = {
      SessionTherapistID: 'Therapist1',
      DataCollectorID: 'DC1',
      DataCollectorRole: 'Primary',
      SessionDurationS: 1200,
      SessionTerminationOption: 'End on Primary Timer',
      SessionNumber: 2,
      SessionKeySet: 'DEFAULT_KEY_SET',
      SessionCondition: 'Condition1',
    };

    const expectedOutput: SavedSettings = {
      Therapist: 'Therapist1',
      Initials: 'DC1',
      Role: 'Primary',
      DurationS: 1200,
      TimerOption: 'End on Primary Timer',
      Session: 2,
      KeySet: 'DEFAULT_KEY_SET',
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
      SessionTerminationOption: 'End on Secondary Timer' as SessionTerminationOptionsType,
      SessionNumber: 1,
      SessionKeySet: 'DEFAULT_KEY_SET',
      SessionCondition: '',
    };

    const expectedOutput: SavedSettings = {
      Therapist: '',
      Initials: '',
      Role: 'Reliability',
      DurationS: 0,
      TimerOption: 'End on Secondary Timer' as SessionTerminationOptionsType,
      Session: 1,
      KeySet: 'DEFAULT_KEY_SET',
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
      SessionKeySet: 'DEFAULT_KEY_SET',
      SessionCondition: '',
    };

    const expectedOutput: SavedSettings = {
      Therapist: 'Therapist2',
      Initials: '',
      Role: 'Primary',
      DurationS: 600,
      TimerOption: 'End on Primary Timer',
      Session: 1,
      KeySet: 'DEFAULT_KEY_SET',
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
      SessionKeySet: 'DEFAULT_KEY_SET',
      SessionCondition: 'Condition3',
    };

    const expectedOutput: SavedSettings = {
      Therapist: 'Therapist3',
      Initials: 'DC2',
      Role: 'Reliability',
      DurationS: 1800,
      TimerOption: 'End on Primary Timer',
      Session: 3,
      KeySet: 'DEFAULT_KEY_SET',
      Condition: 'Condition3',
    };

    const result = toSavedSettings(input);
    expect(result).toEqual(expectedOutput);
  });
});
