import { describe, it, expect } from 'vitest';
import {
  filterSessionsByPrimaryRole,
  filterSessionsByReliabilityRole,
  getUniqueSessionConditions,
} from '../session-filters';
import type { SavedSessionResult } from '../../dtos/session-results';

function makeResult(overrides: { Role?: string; Session?: number; Condition?: string | null }) {
  return {
    SessionSettings: {
      Role: overrides.Role ?? 'Primary',
      Session: overrides.Session ?? 1,
      Condition: overrides.Condition,
    },
  } as unknown as SavedSessionResult;
}

describe('session-filters', () => {
  describe('filterSessionsByPrimaryRole', () => {
    it('keeps only Primary sessions, sorted by numbered session', () => {
      const results = [
        makeResult({ Role: 'Primary', Session: 3 }),
        makeResult({ Role: 'Reliability', Session: 1 }),
        makeResult({ Role: 'Primary', Session: 1 }),
        makeResult({ Role: 'Primary', Session: 2 }),
      ];

      const filtered = filterSessionsByPrimaryRole(results);

      expect(filtered.map((r) => r.SessionSettings.Session)).toEqual([1, 2, 3]);
      expect(filtered.every((r) => r.SessionSettings.Role === 'Primary')).toBe(true);
    });

    it('skips entries that are missing settings without throwing', () => {
      const results = [
        { SessionSettings: undefined } as unknown as SavedSessionResult,
        null as unknown as SavedSessionResult,
        makeResult({ Role: 'Primary', Session: 2 }),
      ];

      const filtered = filterSessionsByPrimaryRole(results);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].SessionSettings.Session).toBe(2);
    });

    it('returns an empty array when no Primary sessions exist', () => {
      expect(filterSessionsByPrimaryRole([makeResult({ Role: 'Reliability' })])).toEqual([]);
    });
  });

  describe('filterSessionsByReliabilityRole', () => {
    it('keeps only Reliability sessions, sorted by numbered session', () => {
      const results = [
        makeResult({ Role: 'Reliability', Session: 5 }),
        makeResult({ Role: 'Primary', Session: 1 }),
        makeResult({ Role: 'Reliability', Session: 4 }),
      ];

      const filtered = filterSessionsByReliabilityRole(results);

      expect(filtered.map((r) => r.SessionSettings.Session)).toEqual([4, 5]);
      expect(filtered.every((r) => r.SessionSettings.Role === 'Reliability')).toBe(true);
    });

    it('skips entries that are null or missing settings', () => {
      const results = [
        null as unknown as SavedSessionResult,
        { SessionSettings: undefined } as unknown as SavedSessionResult,
        makeResult({ Role: 'Reliability', Session: 7 }),
      ];

      const filtered = filterSessionsByReliabilityRole(results);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].SessionSettings.Session).toBe(7);
    });
  });

  describe('getUniqueSessionConditions', () => {
    it('returns unique conditions and drops null or undefined ones', () => {
      const results = [
        makeResult({ Condition: 'Baseline' }),
        makeResult({ Condition: 'Treatment' }),
        makeResult({ Condition: 'Baseline' }),
        makeResult({ Condition: null }),
        makeResult({ Condition: undefined }),
        null as unknown as SavedSessionResult,
      ];

      expect(getUniqueSessionConditions(results)).toEqual(['Baseline', 'Treatment']);
    });

    it('keeps empty-string conditions, since only null-like values are excluded', () => {
      expect(getUniqueSessionConditions([makeResult({ Condition: '' })])).toEqual(['']);
    });

    it('returns an empty array for no results', () => {
      expect(getUniqueSessionConditions([])).toEqual([]);
    });
  });
});
