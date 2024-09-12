import { KeySet, KeySetInstance } from '../../types/keyset';
import { is_key_already_assigned } from '../keys';

describe('is_key_already_assigned', () => {
  it('should return true if the key code is found in FrequencyKeys', () => {
    const keySet = {
      FrequencyKeys: [
        { KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 },
        { KeyName: 'B', KeyDescription: 'Key B', KeyCode: 66 },
      ],
      DurationKeys: [{ KeyName: 'D', KeyDescription: 'Key D', KeyCode: 68 }],
    } as KeySet;

    const result = is_key_already_assigned(keySet, 65);
    expect(result).toBeTruthy();
  });

  it('should return true if the key code is found in DurationKeys', () => {
    const keySet: KeySet = {
      FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }],
      DurationKeys: [{ KeyName: 'D', KeyDescription: 'Key D', KeyCode: 68 }],
    } as KeySet;

    const result = is_key_already_assigned(keySet, 68);
    expect(result).toBeTruthy();
  });

  it('should return false if the key code is not found in any key set', () => {
    const keySet: KeySet = {
      FrequencyKeys: [{ KeyName: 'A', KeyDescription: 'Key A', KeyCode: 65 }],
      DurationKeys: [{ KeyName: 'D', KeyDescription: 'Key D', KeyCode: 68 }],
    } as KeySet;

    const result = is_key_already_assigned(keySet, 70); // 70 is not assigned
    expect(result).toBeFalsy();
  });

  it('should return false if the KeySet is empty', () => {
    const keySet: KeySet = {
      FrequencyKeys: [] as KeySetInstance[],
      DurationKeys: [] as KeySetInstance[],
    } as KeySet;

    const result = is_key_already_assigned(keySet, 65);
    expect(result).toBeFalsy();
  });
});
