import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Hoisted mocks -----

const mockEvaluate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    default: () => <p data-testid="mdx-output">rendered mdx content</p>,
  }),
);

// ----- Module mocks -----

vi.mock('@mdx-js/mdx', () => ({
  evaluate: mockEvaluate,
}));

vi.mock('rehype-highlight', () => ({
  default: () => {},
}));

// ----- Import under test -----

import { MdViewer } from '../md-viewer';

// ----- Tests -----

describe('MdViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEvaluate.mockResolvedValue({
      default: () => <p data-testid="mdx-output">rendered mdx content</p>,
    });
  });

  it('calls evaluate with the provided source', async () => {
    render(<MdViewer source="# Hello" />);
    await waitFor(() => {
      expect(mockEvaluate).toHaveBeenCalledWith('# Hello', expect.any(Object));
    });
  });

  it('renders evaluated MDX content after evaluate resolves', async () => {
    render(<MdViewer source="# Hello" />);
    await waitFor(() => {
      expect(screen.getByTestId('mdx-output')).not.toBeNull();
    });
  });

  it('renders the text content from the MDX component', async () => {
    render(<MdViewer source="# Hello" />);
    await waitFor(() => {
      expect(screen.getByText('rendered mdx content')).not.toBeNull();
    });
  });

  it('uses empty string as default when source is not provided', async () => {
    render(<MdViewer />);
    await waitFor(() => {
      expect(mockEvaluate).toHaveBeenCalledWith('', expect.any(Object));
    });
  });

  it('re-evaluates when source prop changes', async () => {
    const { rerender } = render(<MdViewer source="# First" />);
    await waitFor(() => expect(mockEvaluate).toHaveBeenCalledTimes(1));

    rerender(<MdViewer source="# Second" />);
    await waitFor(() => {
      expect(mockEvaluate).toHaveBeenCalledTimes(2);
      expect(mockEvaluate).toHaveBeenLastCalledWith('# Second', expect.any(Object));
    });
  });

  it('passes rehypeHighlight as a rehype plugin to evaluate', async () => {
    render(<MdViewer source="code" />);
    await waitFor(() => {
      const opts = mockEvaluate.mock.calls[0][1];
      expect(Array.isArray(opts.rehypePlugins)).toBe(true);
      expect(opts.rehypePlugins.length).toBeGreaterThan(0);
    });
  });
});
