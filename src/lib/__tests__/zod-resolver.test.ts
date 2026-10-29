import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { zodResolver } from '../zod-resolver';

const schema = z.object({
  name: z.string().min(2, { message: 'too short' }),
  count: z.coerce.number().min(1, { message: 'must be positive' }),
  nested: z.object({ tag: z.string().min(1, { message: 'tag required' }) }),
});

const options = { fields: {}, shouldUseNativeValidation: false } as never;

describe('zodResolver', () => {
  it('returns parsed (coerced) values and no errors for valid input', async () => {
    const result = await zodResolver(schema)({ name: 'ab', count: '3', nested: { tag: 'x' } }, undefined, options);

    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ name: 'ab', count: 3, nested: { tag: 'x' } });
  });

  it('returns field errors instead of throwing for invalid input', async () => {
    const result = await zodResolver(schema)({ name: 'a', count: '0', nested: { tag: '' } }, undefined, options);

    expect(result.values).toEqual({});
    expect(result.errors).toMatchObject({
      name: { message: 'too short' },
      count: { message: 'must be positive' },
      nested: { tag: { message: 'tag required' } },
    });
  });

  it('keeps only the first issue per field', async () => {
    const strict = z.object({ name: z.string().min(5, { message: 'first' }).regex(/^\d+$/, { message: 'second' }) });
    const result = await zodResolver(strict)({ name: 'ab' }, undefined, options);

    expect(result.errors).toMatchObject({ name: { message: 'first' } });
  });
});
