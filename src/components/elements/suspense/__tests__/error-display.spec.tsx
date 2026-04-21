import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ErrorDisplay } from '../error-display';

describe('ErrorDisplay', () => {
  it('renders the default message when no Text prop is provided', () => {
    render(<ErrorDisplay />);
    expect(screen.getByText('An error occurred while loading the data.')).not.toBeNull();
  });

  it('renders the provided Text prop instead of the default', () => {
    render(<ErrorDisplay Text="Something went wrong." />);
    expect(screen.getByText('Something went wrong.')).not.toBeNull();
  });

  it('does not render the default message when Text is provided', () => {
    render(<ErrorDisplay Text="Custom error" />);
    expect(screen.queryByText('An error occurred while loading the data.')).toBeNull();
  });

  it('renders the message with red text styling', () => {
    render(<ErrorDisplay />);
    const p = screen.getByText('An error occurred while loading the data.');
    expect(p.className).toContain('text-red-500');
  });
});
