import { render } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import ScrollReset from '../scroll-reset';

vi.mock('@tanstack/react-router', () => ({
  useLocation: vi.fn(),
}));

import { useLocation } from '@tanstack/react-router';

const mockUseLocation = useLocation as ReturnType<typeof vi.fn>;

describe('ScrollReset', () => {
  let scrollToSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    mockUseLocation.mockReturnValue({ pathname: '/initial' });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing into the DOM', () => {
    const { container } = render(<ScrollReset />);
    expect(container.firstChild).toBeNull();
  });

  it('calls window.scrollTo(0, 0) on initial mount', () => {
    render(<ScrollReset />);
    expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
  });

  it('calls window.scrollTo(0, 0) again when pathname changes', () => {
    const { rerender } = render(<ScrollReset />);
    scrollToSpy.mockClear();

    mockUseLocation.mockReturnValue({ pathname: '/new-path' });
    rerender(<ScrollReset />);

    expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
    expect(scrollToSpy).toHaveBeenCalledTimes(1);
  });

  it('does not call window.scrollTo when pathname is unchanged on re-render', () => {
    const { rerender } = render(<ScrollReset />);
    scrollToSpy.mockClear();

    mockUseLocation.mockReturnValue({ pathname: '/initial' });
    rerender(<ScrollReset />);

    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});
