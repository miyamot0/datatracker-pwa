import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LoadingDisplay } from '../loading-display';

describe('LoadingDisplay', () => {
  it('renders the sr-only "Loading..." text for accessibility', () => {
    render(<LoadingDisplay />);
    expect(screen.getByText('Loading...')).not.toBeNull();
  });

  it('renders four animated bounce dots', () => {
    const { container } = render(<LoadingDisplay />);
    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots.length).toBe(4);
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
});
