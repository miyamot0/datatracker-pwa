import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingDisplay } from '../loading-display';

describe('LoadingDisplay', () => {
  it('renders the sr-only "Loading..." text for accessibility', () => {
    render(<LoadingDisplay />);
    expect(screen.getByText('Loading...')).not.toBeNull();
  });

  it('renders the sr-only text inside a span element', () => {
    render(<LoadingDisplay />);
    const span = screen.getByText('Loading...');
    expect(span.tagName).toBe('SPAN');
    expect(span.className).toContain('sr-only');
  });

  it('renders the outer container with centering layout classes', () => {
    const { container } = render(<LoadingDisplay />);
    const outer = container.firstElementChild as HTMLElement;
    expect(outer.className).toContain('flex');
    expect(outer.className).toContain('items-center');
    expect(outer.className).toContain('justify-center');
    expect(outer.className).toContain('py-[10%]');
  });

  it('renders the inner wrapper with spacing and centering classes', () => {
    const { container } = render(<LoadingDisplay />);
    const inner = container.firstElementChild!.firstElementChild as HTMLElement;
    expect(inner.className).toContain('flex');
    expect(inner.className).toContain('space-x-2');
    expect(inner.className).toContain('justify-center');
    expect(inner.className).toContain('items-center');
    expect(inner.className).toContain('my-4');
  });

  it('renders four animated bounce dots', () => {
    const { container } = render(<LoadingDisplay />);
    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots.length).toBe(4);
  });

  it('each dot has the shared base size and shape classes', () => {
    const { container } = render(<LoadingDisplay />);
    const dots = Array.from(container.querySelectorAll('.animate-bounce'));
    for (const dot of dots) {
      expect(dot.className).toContain('h-3');
      expect(dot.className).toContain('w-3');
      expect(dot.className).toContain('bg-blue-600');
      expect(dot.className).toContain('rounded-full');
    }
  });

  it('applies the correct animation delay classes to the first three dots', () => {
    const { container } = render(<LoadingDisplay />);
    const dots = Array.from(container.querySelectorAll('.animate-bounce'));
    expect(dots[0].className).toContain('[animation-delay:-0.45s]');
    expect(dots[1].className).toContain('[animation-delay:-0.3s]');
    expect(dots[2].className).toContain('[animation-delay:-0.15s]');
  });

  it('the fourth dot has no animation delay class', () => {
    const { container } = render(<LoadingDisplay />);
    const dots = Array.from(container.querySelectorAll('.animate-bounce'));
    expect(dots[3].className).not.toContain('animation-delay');
  });

  it('renders correctly when used as a React.Suspense fallback', () => {
    const neverResolve = new Promise<void>(() => {});
    function SuspendingChild(): React.ReactElement {
      throw neverResolve;
    }

    const { container } = render(
      <React.Suspense fallback={<LoadingDisplay />}>
        <SuspendingChild />
      </React.Suspense>,
    );

    expect(screen.getByText('Loading...')).not.toBeNull();
    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots.length).toBe(4);
  });
});
