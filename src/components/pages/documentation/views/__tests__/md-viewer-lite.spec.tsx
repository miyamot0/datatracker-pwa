import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { describe, it, expect } from 'vitest';

// ----- Import under test -----

import { MdViewerLite } from '../md-viewer-lite';

// ----- Tests -----

describe('MdViewerLite', () => {
  it('renders the provided pre-rendered HTML', async () => {
    await render(<MdViewerLite html="<h1>Hello</h1>" />);
    await expect.element(page.getByRole('heading', { name: 'Hello' })).toBeInTheDocument();
  });

  it('renders highlighted code blocks as HTML', async () => {
    await render(<MdViewerLite html='<pre class="tm-code"><code class="language-js"><span class="th-token th-keyword">const</span></code></pre>' />);
    await expect.element(page.getByText('const')).toHaveClass('th-token');
  });

  it('renders nothing when html is not provided', async () => {
    const { container } = await render(<MdViewerLite />);
    expect(container.querySelector('div')?.innerHTML).toBe('');
  });

  it('re-renders when the html prop changes', async () => {
    const { rerender } = await render(<MdViewerLite html="<p>First</p>" />);
    await expect.element(page.getByText('First')).toBeInTheDocument();

    await rerender(<MdViewerLite html="<p>Second</p>" />);
    await expect.element(page.getByText('Second')).toBeInTheDocument();
  });
});

