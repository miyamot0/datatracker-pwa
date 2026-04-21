import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { scrollPageToTop } from '../window.ts';

describe('window.ts', () => {
  let mockScrollTo: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock window.scrollTo
    mockScrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', {
      value: mockScrollTo,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockScrollTo.mockClear();
  });

  describe('scrollPageToTop', () => {
    it('should call window.scrollTo with correct parameters', () => {
      scrollPageToTop();

      expect(mockScrollTo).toHaveBeenCalledTimes(1);
      expect(mockScrollTo).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });

    it('should call window.scrollTo exactly once when called once', () => {
      scrollPageToTop();

      expect(mockScrollTo).toHaveBeenCalledTimes(1);
    });

    it('should call window.scrollTo multiple times when called multiple times', () => {
      scrollPageToTop();
      scrollPageToTop();
      scrollPageToTop();

      expect(mockScrollTo).toHaveBeenCalledTimes(3);

      // Verify each call had the same parameters
      expect(mockScrollTo).toHaveBeenNthCalledWith(1, {
        top: 0,
        behavior: 'smooth',
      });
      expect(mockScrollTo).toHaveBeenNthCalledWith(2, {
        top: 0,
        behavior: 'smooth',
      });
      expect(mockScrollTo).toHaveBeenNthCalledWith(3, {
        top: 0,
        behavior: 'smooth',
      });
    });

    it('should use smooth scrolling behavior', () => {
      scrollPageToTop();

      const callArguments = mockScrollTo.mock.calls[0][0];
      expect(callArguments.behavior).toBe('smooth');
    });

    it('should scroll to top position (0)', () => {
      scrollPageToTop();

      const callArguments = mockScrollTo.mock.calls[0][0];
      expect(callArguments.top).toBe(0);
    });

    it('should not throw error when called', () => {
      expect(() => scrollPageToTop()).not.toThrow();
    });

    it('should handle case when window.scrollTo throws an error', () => {
      // Mock scrollTo to throw an error
      mockScrollTo.mockImplementation(() => {
        throw new Error('ScrollTo failed');
      });

      // The function should still be callable, but will throw
      expect(() => scrollPageToTop()).toThrow('ScrollTo failed');
      expect(mockScrollTo).toHaveBeenCalledTimes(1);
    });

    it('should work with jest spy implementation', () => {
      // Alternative implementation test using different spy approach
      const scrollToSpy = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

      scrollPageToTop();

      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });

      scrollToSpy.mockRestore();
    });
  });
});
