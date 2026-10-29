import { describe, expect, it } from 'vitest';
import { buildDeIdentifySchema, MIN_CLIENT_NAME_LENGTH } from '../helpers';

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
