import { getLocalCachedPrefs, ReturnLocalStorageCache, setLocalCachedPrefs } from '../local_storage'; // Adjust the import path

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
        CTBElements: [],
        Schedule: 'End on Timer #1',
      };

      const result = getLocalCachedPrefs(group, individual, evaluation, type);
      expect(result).toEqual(defaultCache);
    });

    it.skip('should handle malformed data in localStorage by returning the default object', () => {
      localStorage.setItem(dynamicKey, 'malformed_data');

      const result = getLocalCachedPrefs(group, individual, evaluation, type);
      const defaultCache = {
        KeyDescription: [],
        CTBElements: [],
        Schedule: 'End on Timer #1',
      };
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
        mockCache as ReturnLocalStorageCache
      );

      const storedValue = localStorage.getItem(trimmedKey);
      expect(storedValue).toEqual(JSON.stringify(mockCache));
    });
  });
});
