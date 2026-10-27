import {
  getLocalCachedPrefs,
  getLocalSeriesStyles,
  ReturnLocalStorageCache,
  setLocalCachedPrefs,
  setLocalSeriesStyles,
} from '../local_storage'; // Adjust the import path

describe('LocalStorage Prefs', () => {
  const group = 'group1';
  const individual = 'individual1';
  const evaluation = 'evaluation1';
  const type = 'Rate';
  const dynamicKey = `${group}_${individual}_${evaluation}_${type}`;

  const mockCache = {
    KeyDescription: ['Key1', 'Key2'],
    CTBElements: ['Element1'],
    Schedule: 'End on Timer #2',
  };

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('getLocalCachedPrefs', () => {
    it('should return the cached object from localStorage if it exists', () => {
      localStorage.setItem(dynamicKey, JSON.stringify(mockCache));

      const result = getLocalCachedPrefs(group, individual, evaluation, type);
      expect(result).toEqual(mockCache);
    });

    it('should return the default object if localStorage does not contain the key', () => {
      const defaultCache = {
        KeyDescription: [],
        Schedule: 'End on Timer #1',
      };

      const result = getLocalCachedPrefs(group, individual, evaluation, type);
      expect(result).toEqual(defaultCache);
    });
  });

  describe('setLocalCachedPrefs', () => {
    it('should set the cached object in localStorage', () => {
      setLocalCachedPrefs(group, individual, evaluation, type, mockCache as ReturnLocalStorageCache);

      const storedValue = localStorage.getItem(dynamicKey);
      expect(storedValue).toEqual(JSON.stringify(mockCache));
    });

    it('should correctly handle leading/trailing spaces in the group, individual, and evaluation parameters', () => {
      const groupWithSpaces = ' group1 ';
      const individualWithSpaces = ' individual1 ';
      const evaluationWithSpaces = ' evaluation1 ';

      const trimmedKey = `${group.trim()}_${individual.trim()}_${evaluation.trim()}_${type}`;

      setLocalCachedPrefs(
        groupWithSpaces,
        individualWithSpaces,
        evaluationWithSpaces,
        type,
        mockCache as ReturnLocalStorageCache,
      );

      const storedValue = localStorage.getItem(trimmedKey);
      expect(storedValue).toEqual(JSON.stringify(mockCache));
    });
  });

  describe('series styles', () => {
    it('returns empty styles when nothing has been saved', () => {
      expect(getLocalSeriesStyles('group1', 'individual1', 'evaluation1')).toEqual({
        KeyStyles: {},
        ConditionStyles: {},
      });
    });

    it('stores under the trimmed group, individual, and evaluation key', () => {
      const styles = { KeyStyles: { Hitting: { shape: 'star' as const } }, ConditionStyles: {} };

      setLocalSeriesStyles(' group1 ', ' individual1 ', ' evaluation1 ', styles);

      expect(localStorage.getItem('group1_individual1_evaluation1_SeriesStyles')).toBe(JSON.stringify(styles));
      expect(getLocalSeriesStyles('group1', 'individual1', 'evaluation1')).toEqual(styles);
    });

    it('does not share styles across a different individual or evaluation', () => {
      const styles = { KeyStyles: {}, ConditionStyles: { Baseline: { color: '#FF0000' } } };

      setLocalSeriesStyles('group1', 'individual1', 'evaluation1', styles);

      expect(getLocalSeriesStyles('group1', 'individual2', 'evaluation1')).toEqual({
        KeyStyles: {},
        ConditionStyles: {},
      });
      expect(getLocalSeriesStyles('group1', 'individual1', 'evaluation2')).toEqual({
        KeyStyles: {},
        ConditionStyles: {},
      });
    });

    it('fills in a missing KeyStyles or ConditionStyles section when a saved object is partial', () => {
      localStorage.setItem(
        'group1_individual1_evaluation1_SeriesStyles',
        JSON.stringify({ KeyStyles: { Hitting: { shape: 'star' } } }),
      );

      expect(getLocalSeriesStyles('group1', 'individual1', 'evaluation1')).toEqual({
        KeyStyles: { Hitting: { shape: 'star' } },
        ConditionStyles: {},
      });
    });
  });
});
