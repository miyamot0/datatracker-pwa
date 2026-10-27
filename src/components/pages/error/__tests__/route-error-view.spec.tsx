import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RouteErrorRedirect, RouteErrorView } from '../route-error-view';
import type { RouteErrorPayload } from '@/lib/route-error';

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
  redirect: vi.fn(),
  isRedirect: vi.fn(() => false),
  isNotFound: vi.fn(() => false),
  notFound: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  isDevelopment: false,
  isProduction: true,
}));

const payload: RouteErrorPayload = {
  message: 'KeySet not found.',
  code: 'KS-404',
  source: '/session/g/i/e/reli',
  occurredAt: '2026-10-27T12:00:00.000Z',
  stack: 'Error: KeySet not found.\n    at reli.tsx:10',
};

describe('RouteErrorView', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('renders the message, code, and page details', () => {
    render(<RouteErrorView payload={payload} />);
    expect(screen.getByText('KeySet not found.')).not.toBeNull();
    expect(screen.getByText('KS-404')).not.toBeNull();
    expect(screen.getByText('/session/g/i/e/reli')).not.toBeNull();
  });

  it('hides the stack trace outside development', () => {
    render(<RouteErrorView payload={payload} />);
    expect(screen.queryByText(/at reli.tsx:10/)).toBeNull();
  });

  it('Return navigates to the parent page when no returnTo is set', () => {
    render(<RouteErrorView payload={payload} />);
    fireEvent.click(screen.getByText('Return'));
    expect(mockNavigate).toHaveBeenCalledWith({ href: '/session/g/i/e' });
  });

  it('Return navigates to returnTo when it is set', () => {
    render(<RouteErrorView payload={{ ...payload, returnTo: '/dashboard' }} />);
    fireEvent.click(screen.getByText('Return'));
    expect(mockNavigate).toHaveBeenCalledWith({ href: '/dashboard' });
  });

  it('Copy details writes the full payload, including the stack, to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<RouteErrorView payload={payload} />);
    fireEvent.click(screen.getByText('Copy details'));

    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    const copied = JSON.parse(writeText.mock.calls[0][0]);
    expect(copied.message).toBe('KeySet not found.');
    expect(copied.stack).toContain('reli.tsx:10');
  });

  it('shows Copied after the details are written to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<RouteErrorView payload={payload} />);
    fireEvent.click(screen.getByText('Copy details'));

    await waitFor(() => expect(screen.getByText('Copied')).not.toBeNull());
    await waitFor(() => expect(screen.getByText('Copy details')).not.toBeNull(), { timeout: 3000 });
  });

  it('keeps the Copy details label when the clipboard write fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<RouteErrorView payload={payload} />);
    fireEvent.click(screen.getByText('Copy details'));

    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Copy details')).not.toBeNull();
    expect(screen.queryByText('Copied')).toBeNull();
  });

  it('omits the code, time, and stack rows when the payload does not include them', () => {
    render(<RouteErrorView payload={{ message: 'Plain failure', source: '/a' } as RouteErrorPayload} />);

    expect(screen.getByText('Plain failure')).not.toBeNull();
    expect(screen.queryByText('Code')).toBeNull();
    expect(screen.queryByText('Time')).toBeNull();
  });
});

describe('RouteErrorRedirect', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it('replaces the current entry with the error route and renders nothing', () => {
    const { container } = render(<RouteErrorRedirect message="Bad state" code="X-1" returnTo="/dashboard" />);

    expect(container.innerHTML).toBe('');
    expect(mockNavigate).toHaveBeenCalledWith(
      expect.objectContaining({
        to: '/error',
        replace: true,
        search: expect.objectContaining({ message: 'Bad state' }),
      }),
    );
  });
});
