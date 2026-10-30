import { describe, it, expect } from 'vitest';
import { trackSettlement } from '../settle-tracking';

type Tracked<T> = Promise<T> & { status?: string; value?: T; reason?: unknown };

describe('trackSettlement', () => {
  it('returns the same promise instance it was given', () => {
    const promise = Promise.resolve(1);

    expect(trackSettlement(promise)).toBe(promise);
  });

  it('leaves a pending promise untagged until it settles', async () => {
    let resolve!: (value: number) => void;
    const promise = new Promise<number>((r) => {
      resolve = r;
    }) as Tracked<number>;

    trackSettlement(promise);
    expect(promise.status).toBeUndefined();
    expect(promise.value).toBeUndefined();

    resolve(42);
    await promise;
    await Promise.resolve();

    expect(promise.status).toBe('fulfilled');
    expect(promise.value).toBe(42);
  });

  it('tags a resolved promise with status fulfilled and its value', async () => {
    const promise = trackSettlement(Promise.resolve({ ok: true })) as Tracked<{ ok: boolean }>;

    await promise;
    await Promise.resolve();

    expect(promise.status).toBe('fulfilled');
    expect(promise.value).toEqual({ ok: true });
    expect(promise.reason).toBeUndefined();
  });

  it('tags a rejected promise with status rejected and its reason', async () => {
    const error = new Error('boom');
    const promise = trackSettlement(Promise.reject(error)) as Tracked<unknown>;

    await expect(promise).rejects.toBe(error);
    await Promise.resolve();

    expect(promise.status).toBe('rejected');
    expect(promise.reason).toBe(error);
    expect(promise.value).toBeUndefined();
  });

  it('does not produce an unhandled rejection from its own bookkeeping', async () => {
    const promise = trackSettlement(Promise.reject(new Error('handled by caller')));

    await expect(promise).rejects.toThrow('handled by caller');
  });
});
