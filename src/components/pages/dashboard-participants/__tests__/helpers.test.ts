import { describe, expect, it } from 'vitest';
import { buildDeIdentifySchema, MIN_CLIENT_NAME_LENGTH, validateNewClientName } from '../helpers';

describe('buildDeIdentifySchema', () => {
  const schema = buildDeIdentifySchema(['Existing Client']);

  it('accepts a valid, non-colliding submission', () => {
    const result = schema.safeParse({ NewName: 'New Client', ReplacementYear: 2000, RedactComments: true });

    expect(result.success).toBe(true);
  });

  it('rejects a name that collides with an existing client', () => {
    const result = schema.safeParse({ NewName: 'Existing Client', ReplacementYear: 2000, RedactComments: true });

    expect(result.success).toBe(false);
  });

  it('rejects a name shorter than the minimum length', () => {
    const result = schema.safeParse({ NewName: 'abc', ReplacementYear: 2000, RedactComments: true });

    expect(result.success).toBe(false);
  });

  it('rejects a replacement year outside the supported range', () => {
    const tooEarly = schema.safeParse({ NewName: 'New Client', ReplacementYear: 1969, RedactComments: true });
    const tooLate = schema.safeParse({ NewName: 'New Client', ReplacementYear: 2027, RedactComments: true });

    expect(tooEarly.success).toBe(false);
    expect(tooLate.success).toBe(false);
  });

  it('defaults RedactComments to true when omitted', () => {
    const result = schema.safeParse({ NewName: 'New Client', ReplacementYear: 2000 });

    expect(result.success).toBe(true);
    expect(result.success && result.data.RedactComments).toBe(true);
  });
});

describe('validateNewClientName', () => {
  it('rejects a duplicate name', () => {
    expect(validateNewClientName('Client1', ['Client1', 'Client2'])).toBe('Client already exists.');
  });

  it('rejects a name shorter than the minimum length', () => {
    expect(validateNewClientName('abc', [])).toBe('Client name must be at least 4 characters long.');
  });

  it('trims surrounding whitespace before validating', () => {
    expect(validateNewClientName('  Client1  ', ['Client1'])).toBe('Client already exists.');
  });

  it('returns null for a valid, non-colliding name', () => {
    expect(validateNewClientName('New Client', ['Client1'])).toBeNull();
  });

  it('uses the shared minimum length constant', () => {
    const nameAtLimit = 'a'.repeat(MIN_CLIENT_NAME_LENGTH);

    expect(validateNewClientName(nameAtLimit, [])).toBeNull();
  });
});
