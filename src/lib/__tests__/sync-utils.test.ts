import { describe, it, expect } from 'vitest';
import { classifySyncFileType } from '../sync-utils';

describe('classifySyncFileType', () => {
  it('should classify depth-3 paths as keyset', () => {
    expect(classifySyncFileType(['Group', 'Individual', 'keyset.json'])).toBe('keyset');
    expect(classifySyncFileType(['Group', 'Individual', 'AnyName.json'])).toBe('keyset');
  });

  it('should classify depth-3 settings.json as keyset, not session_parameters', () => {
    // settings.json directly in individual folder is a keyset, depth check takes priority
    expect(classifySyncFileType(['Group', 'Individual', 'settings.json'])).toBe('keyset');
  });

  it('should classify depth-4 settings.json as session_parameters', () => {
    expect(classifySyncFileType(['Group', 'Individual', 'Evaluation', 'settings.json'])).toBe('session_parameters');
  });

  it('should classify depth-4 non-settings files as session_outcome', () => {
    expect(classifySyncFileType(['Group', 'Individual', 'Evaluation', 'data.json'])).toBe('session_outcome');
    expect(classifySyncFileType(['Group', 'Individual', 'Evaluation', 'other.json'])).toBe('session_outcome');
  });

  it('should classify depth-4 styles.json as figure_styles', () => {
    expect(classifySyncFileType(['Group', 'Individual', 'Evaluation', 'styles.json'])).toBe('figure_styles');
    expect(classifySyncFileType(['Group', 'Individual', 'Evaluation', 'Styles.JSON'])).toBe('figure_styles');
  });

  it('should classify depth-5 styles.json as session_outcome', () => {
    expect(classifySyncFileType(['Group', 'Individual', 'Evaluation', 'Condition', 'styles.json'])).toBe(
      'session_outcome',
    );
  });

  it('should classify depth-5 paths as session_outcome', () => {
    expect(classifySyncFileType(['Group', 'Individual', 'Evaluation', 'Condition', 'data.json'])).toBe(
      'session_outcome',
    );
    expect(classifySyncFileType(['Group', 'Individual', 'Evaluation', 'Condition', 'settings.json'])).toBe(
      'session_outcome',
    );
  });

  it('should classify shallow paths (depth < 3) as session_outcome', () => {
    expect(classifySyncFileType(['Group', 'file.txt'])).toBe('session_outcome');
    expect(classifySyncFileType(['file.txt'])).toBe('session_outcome');
  });
});
