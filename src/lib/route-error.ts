import { isNotFound, isRedirect, redirect } from '@tanstack/react-router';

export const ROUTE_ERROR_PATH = '/error';

const MAX_MESSAGE_LENGTH = 500;
const MAX_STACK_LENGTH = 2000;
const DEFAULT_RETURN_PATH = '/dashboard';

export interface RouteErrorPayload {
  message: string;
  code?: string;
  source: string;
  returnTo?: string;
  occurredAt: string;
  stack?: string;
}

export interface RouteErrorInput {
  message?: string;
  code?: string;
  source?: string;
  returnTo?: string;
  cause?: unknown;
}

/** Path of the page currently shown (hash history), without query string. */
export function getCurrentPath(): string {
  if (typeof window === 'undefined') return '/';
  const path = window.location.hash.replace(/^#/, '').split('?')[0];
  return path || '/';
}

/**
 * Only in-app paths are allowed as return targets. Rejects absolute URLs, protocol-relative
 * paths, and the error route itself (to avoid loops).
 */
export function sanitizeReturnTo(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return undefined;
  if (value === ROUTE_ERROR_PATH || value.startsWith(`${ROUTE_ERROR_PATH}?`)) return undefined;
  return value;
}

/**
 * Default return target: the parent of the failing page. Falls back to the dashboard when
 * the failing page has no meaningful parent.
 */
export function getDefaultReturnPath(source: string): string {
  const segments = source.split('/').filter(Boolean);
  if (segments.length <= 1) return DEFAULT_RETURN_PATH;

  const parent = `/${segments.slice(0, -1).join('/')}`;
  if (parent === '/session') return DEFAULT_RETURN_PATH;
  return parent;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function errorToMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === 'string') return cause;
  return 'An unexpected error occurred.';
}

function errorToStack(cause: unknown): string | undefined {
  return cause instanceof Error && cause.stack ? truncate(cause.stack, MAX_STACK_LENGTH) : undefined;
}

export function buildRouteErrorPayload(input: RouteErrorInput): RouteErrorPayload {
  const source = input.source ?? getCurrentPath();
  return {
    message: truncate(input.message || errorToMessage(input.cause), MAX_MESSAGE_LENGTH),
    code: input.code,
    source,
    returnTo: sanitizeReturnTo(input.returnTo),
    occurredAt: new Date().toISOString(),
    stack: errorToStack(input.cause),
  };
}

/**
 * Normalizes untrusted search params into a payload. Never throws, so a malformed URL
 * shows a generic error instead of crashing the error page.
 */
export function normalizeRouteErrorSearch(search: Record<string, unknown>): RouteErrorPayload {
  const str = (v: unknown, max: number) => (typeof v === 'string' ? truncate(v, max) : undefined);
  const source = str(search.source, 300) ?? DEFAULT_RETURN_PATH;
  return {
    message: str(search.message, MAX_MESSAGE_LENGTH) ?? 'An unexpected error occurred.',
    code: str(search.code, 100),
    source,
    returnTo: sanitizeReturnTo(search.returnTo),
    occurredAt: str(search.occurredAt, 100) ?? '',
    stack: str(search.stack, MAX_STACK_LENGTH),
  };
}

/**
 * Builds the search params for the error route, typed to match its validated search.
 * Undefined and empty values are omitted from the URL.
 */
export function toRouteErrorSearch(payload: RouteErrorPayload): RouteErrorPayload {
  const entries = Object.entries(payload).filter(([, v]) => v !== undefined && v !== '');
  return Object.fromEntries(entries) as RouteErrorPayload;
}

/** Resolves where the Return button should go: explicit returnTo, otherwise the parent page. */
export function resolveReturnPath(payload: Pick<RouteErrorPayload, 'returnTo' | 'source'>): string {
  return payload.returnTo ?? getDefaultReturnPath(payload.source);
}

/**
 * Opt-in: sends the user to the detailed error page. Use inside loaders, beforeLoad, or
 * event handlers. Does not catch router control-flow errors itself.
 */
export function throwRouteError(input: RouteErrorInput): never {
  const payload = buildRouteErrorPayload(input);
  throw redirect({ to: ROUTE_ERROR_PATH, search: toRouteErrorSearch(payload) });
}

/**
 * Re-throws TanStack redirect and notFound objects. Call at the top of any catch block that
 * wraps route code so navigation is not swallowed.
 */
export function rethrowRouterControlFlow(error: unknown): void {
  if (isRedirect(error) || isNotFound(error)) {
    throw error;
  }
}
