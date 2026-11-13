import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';
import { parseMarkdown } from '@tanstack/markdown/parser';

// ----- Import under test -----

import { MdViewerLite } from '../md-viewer-lite';

// ----- Tests -----

describe('MdViewerLite', () => {
  it('renders a pre-parsed document', async () => {
    await render(<MdViewerLite document={parseMarkdown('# Hello')} />);
    await expect.element(page.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
  });

  it('highlights code with the TanStack adapter', async () => {
    await render(<MdViewerLite document={parseMarkdown('```js\nconst answer = 42;\n```')} />);
    await expect.element(page.getByText('const', { exact: true })).toHaveClass('th-keyword');
  });

  it('renders nothing when a document is not provided', async () => {
    const { container } = await render(<MdViewerLite />);
    expect(container.querySelector('div')?.innerHTML).toBe('');
  });

  it('re-renders when the document changes', async () => {
    const { rerender } = await render(<MdViewerLite document={parseMarkdown('First')} />);
    await expect.element(page.getByText('First')).toBeInTheDocument();

    await rerender(<MdViewerLite document={parseMarkdown('Second')} />);
    await expect.element(page.getByText('Second')).toBeInTheDocument();
  });

  it('does not interpret raw document HTML or tag-looking code', async () => {
    const source = '<img src=x onerror="alert(1)">\n\n```js\nconst tag = "<script>example()</script>";\n```';
    const { container } = await render(<MdViewerLite document={parseMarkdown(source, { allowHtml: false })} />);

    expect(container.querySelector('img, script, [onerror]')).toBeNull();
    expect(container.querySelector('code')?.textContent).toBe('const tag = "<script>example()</script>";');
  });
});

