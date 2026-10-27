import { describe, it, expect, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  redirect: vi.fn((options) => {
    const error = new Error('Redirect');
    (error as any).redirect = options;
    return error;
  }),
  isRedirect: vi.fn((e: any) => e instanceof Error && 'redirect' in e),
  isNotFound: vi.fn(() => false),
}));

import {
  buildRouteErrorPayload,
  getDefaultReturnPath,
  normalizeRouteErrorSearch,
  resolveReturnPath,
  rethrowRouterControlFlow,
  sanitizeReturnTo,
  throwRouteError,
  toRouteErrorSearch,
} from '../route-error';

describe('sanitizeReturnTo', () => {
  it('accepts in-app paths', () => {
    expect(sanitizeReturnTo('/dashboard')).toBe('/dashboard');
    expect(sanitizeReturnTo('/session/g/i/e')).toBe('/session/g/i/e');
  });

  it('rejects absolute, protocol-relative, and non-string values', () => {
    expect(sanitizeReturnTo('https://evil.example')).toBeUndefined();
    expect(sanitizeReturnTo('//evil.example')).toBeUndefined();
    expect(sanitizeReturnTo('/\\evil.example')).toBeUndefined();
    expect(sanitizeReturnTo(42)).toBeUndefined();
    expect(sanitizeReturnTo(undefined)).toBeUndefined();
  });

  it('rejects the error route to avoid loops', () => {
    expect(sanitizeReturnTo('/error')).toBeUndefined();
    expect(sanitizeReturnTo('/error?message=x')).toBeUndefined();
  });
});

describe('getDefaultReturnPath', () => {
  it('returns the parent of a nested page', () => {
    expect(getDefaultReturnPath('/session/g/i/e/reli')).toBe('/session/g/i/e');
  });

  it('falls back to the dashboard for top-level or session-root pages', () => {
    expect(getDefaultReturnPath('/')).toBe('/dashboard');
    expect(getDefaultReturnPath('/dashboard')).toBe('/dashboard');
    expect(getDefaultReturnPath('/session/g')).toBe('/dashboard');
  });
});

describe('resolveReturnPath', () => {
  it('prefers an explicit returnTo', () => {
    expect(resolveReturnPath({ returnTo: '/custom', source: '/session/g/i/e/reli' })).toBe('/custom');
  });

  it('uses the parent when no returnTo is set', () => {
    expect(resolveReturnPath({ source: '/session/g/i/e/reli' })).toBe('/session/g/i/e');
  });
});

describe('buildRouteErrorPayload', () => {
  it('truncates long messages and drops unsafe returnTo values', () => {
    const payload = buildRouteErrorPayload({
      message: 'x'.repeat(1000),
      source: '/session/g/i',
      returnTo: 'https://evil.example',
    });
    expect(payload.message.length).toBeLessThanOrEqual(501);
    expect(payload.returnTo).toBeUndefined();
    expect(payload.source).toBe('/session/g/i');
    expect(Number.isNaN(Date.parse(payload.occurredAt))).toBe(false);
  });

  it('captures the message and stack from an Error cause', () => {
    const cause = new Error('boom');
    const payload = buildRouteErrorPayload({ message: '', cause, source: '/x' });
    expect(payload.message).toBe('boom');
    expect(payload.stack).toContain('boom');
  });
});

describe('normalizeRouteErrorSearch', () => {
  it('never throws and falls back for missing or invalid params', () => {
    const payload = normalizeRouteErrorSearch({ message: 42, returnTo: 'https://x' });
    expect(payload.message).toBe('An unexpected error occurred.');
    expect(payload.returnTo).toBeUndefined();
    expect(payload.source).toBe('/dashboard');
  });

  it('round-trips a payload built by toRouteErrorSearch', () => {
    const built = buildRouteErrorPayload({ message: 'Oops', code: 'E1', source: '/session/g', returnTo: '/dashboard' });
    const parsed = normalizeRouteErrorSearch({ ...toRouteErrorSearch(built) });
    expect(parsed.message).toBe('Oops');
    expect(parsed.code).toBe('E1');
    expect(parsed.returnTo).toBe('/dashboard');
  });
});

describe('throwRouteError', () => {
  it('throws a redirect to the error route with the payload as search', () => {
    let thrown: any;
    try {
      throwRouteError({ message: 'KeySet missing', source: '/session/g/i/e/reli' });
    } catch (e) {
      thrown = e;
    }
    expect(thrown.redirect.to).toBe('/error');
    expect(thrown.redirect.search.message).toBe('KeySet missing');
    expect(thrown.redirect.search.source).toBe('/session/g/i/e/reli');
  });
});

describe('rethrowRouterControlFlow', () => {
  it('rethrows redirect objects', () => {
    const redirectErr = new Error('Redirect') as any;
    redirectErr.redirect = { to: '/dashboard' };
    expect(() => rethrowRouterControlFlow(redirectErr)).toThrow();
  });

  it('does nothing for ordinary errors', () => {
    expect(() => rethrowRouterControlFlow(new Error('plain'))).not.toThrow();
  });
});
