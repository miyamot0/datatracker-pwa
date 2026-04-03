import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// ----- Module mocks -----

vi.mock('react-markdown', () => ({
  default: ({ children, components, rehypePlugins }) => (
    <div data-testid="react-markdown" data-rehype-plugins={rehypePlugins?.length || 0}>
      {components?.img && <div data-testid="custom-img-component">Custom img component present</div>}
      <div data-testid="markdown-content">{children}</div>
    </div>
  ),
}));

vi.mock('rehype-highlight', () => ({
  default: () => {},
}));

// ----- Import under test -----

import { MdViewerLite } from '../md-viewer-lite';

// ----- Tests -----

describe('MdViewerLite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders react-markdown with the provided source', async () => {
    await render(<MdViewerLite source="# Hello" />);
    await expect.element(page.getByTestId('react-markdown')).toBeInTheDocument();
    await expect.element(page.getByTestId('markdown-content')).toHaveTextContent('# Hello');
  });

  it('renders markdown content immediately', async () => {
    await render(<MdViewerLite source="# Hello World" />);
    await expect.element(page.getByTestId('react-markdown')).toBeInTheDocument();
    await expect.element(page.getByTestId('markdown-content')).toHaveTextContent('# Hello World');
  });

  it('provides custom image component', async () => {
    await render(<MdViewerLite source="![alt](image.jpg)" />);
    await expect.element(page.getByTestId('custom-img-component')).toBeInTheDocument();
  });

  it('uses empty string as default when source is not provided', async () => {
    await render(<MdViewerLite />);
    await expect.element(page.getByTestId('react-markdown')).toBeInTheDocument();
    await expect.element(page.getByTestId('markdown-content')).toHaveTextContent('');
  });

  it('re-renders when source prop changes', async () => {
    const { rerender } = await render(<MdViewerLite source="# First" />);
    await expect.element(page.getByTestId('markdown-content')).toHaveTextContent('# First');

    await rerender(<MdViewerLite source="# Second" />);
    await expect.element(page.getByTestId('markdown-content')).toHaveTextContent('# Second');
  });

  it('passes rehypeHighlight as a rehype plugin to react-markdown', async () => {
    await render(<MdViewerLite source="```js\nconsole.log('hello')\n```" />);
    const markdown = page.getByTestId('react-markdown');
    await expect.element(markdown).toBeInTheDocument();
    await expect.element(markdown).toHaveAttribute('data-rehype-plugins', '1');
  });
});
