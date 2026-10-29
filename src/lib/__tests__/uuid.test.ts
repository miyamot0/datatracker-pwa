import { describe, expect, it, vi, afterEach } from 'vitest';

import { v4 } from '@/lib/uuid';

const V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('v4', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns a valid v4 UUID using crypto.randomUUID when available', () => {
    const spy = vi.fn(() => 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
    vi.stubGlobal('crypto', { randomUUID: spy });

    expect(v4()).toBe('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee');
    expect(spy).toHaveBeenCalledOnce();
  });

  it('falls back to getRandomValues when randomUUID is unavailable', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (arr: Uint8Array) => {
        arr.fill(0xff);
        return arr;
      },
    });

    const id = v4();
    expect(id).toMatch(V4_PATTERN);
    expect(id).toBe('ffffffff-ffff-4fff-bfff-ffffffffffff');
  });

  it('generates distinct values in the fallback path', () => {
    const realGetRandomValues = crypto.getRandomValues.bind(crypto);
    vi.stubGlobal('crypto', { getRandomValues: realGetRandomValues });

    const ids = new Set(Array.from({ length: 50 }, () => v4()));
    expect(ids.size).toBe(50);
    ids.forEach((id) => expect(id).toMatch(V4_PATTERN));
  });
});
