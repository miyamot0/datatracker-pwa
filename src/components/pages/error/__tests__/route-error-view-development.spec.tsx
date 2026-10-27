import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RouteErrorView } from '../route-error-view';
import type { RouteErrorPayload } from '@/lib/route-error';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  redirect: vi.fn(),
  isRedirect: vi.fn(() => false),
  isNotFound: vi.fn(() => false),
  notFound: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  isDevelopment: true,
  isProduction: false,
}));

const payload: RouteErrorPayload = {
  message: 'KeySet not found.',
  source: '/session/g/i/e/reli',
  occurredAt: '2026-10-27T12:00:00.000Z',
  stack: 'Error: KeySet not found.\n    at reli.tsx:10',
};

describe('RouteErrorView in development', () => {
  it('shows the stack trace', () => {
    render(<RouteErrorView payload={payload} />);

    expect(screen.getByText(/at reli.tsx:10/)).not.toBeNull();
  });
});
