import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
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
    await render(<MdViewer source="# Hello" />);
    await expect.element(page.getByTestId('mdx-output')).toBeInTheDocument();
    expect(mockEvaluate).toHaveBeenCalledWith('# Hello', expect.any(Object));
  });

  it('renders evaluated MDX content after evaluate resolves', async () => {
    await render(<MdViewer source="# Hello" />);
    await expect.element(page.getByTestId('mdx-output')).toBeInTheDocument();
  });

  it('renders the text content from the MDX component', async () => {
    await render(<MdViewer source="# Hello" />);
    await expect.element(page.getByText('rendered mdx content')).toBeInTheDocument();
  });

  it('uses empty string as default when source is not provided', async () => {
    await render(<MdViewer />);
    await expect.element(page.getByTestId('mdx-output')).toBeInTheDocument();
    expect(mockEvaluate).toHaveBeenCalledWith('', expect.any(Object));
  });

  it.skip('re-evaluates when source prop changes', async () => {
    const { rerender } = await render(<MdViewer source="# First" />);
    await expect.element(page.getByTestId('mdx-output')).toBeInTheDocument();
    expect(mockEvaluate).toHaveBeenCalledTimes(1);

    await rerender(<MdViewer source="# Second" />);
    await expect.element(page.getByTestId('mdx-output')).toBeInTheDocument();
    expect(mockEvaluate).toHaveBeenCalledTimes(2);
    expect(mockEvaluate).toHaveBeenLastCalledWith('# Second', expect.any(Object));
  });

  it('passes rehypeHighlight as a rehype plugin to evaluate', async () => {
    await render(<MdViewer source="code" />);
    await expect.element(page.getByTestId('mdx-output')).toBeInTheDocument();
    const opts = mockEvaluate.mock.calls[0][1];
    expect(Array.isArray(opts.rehypePlugins)).toBe(true);
    expect(opts.rehypePlugins.length).toBeGreaterThan(0);
  });
});

