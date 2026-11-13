import type { FC } from 'react';
import type { MarkdownDocument } from '@tanstack/markdown';
import { Markdown } from '@tanstack/markdown/react';
import { createHighlighter } from '@tanstack/highlight/core';
import { js } from '@tanstack/highlight/languages/js';
import { plaintext } from '@tanstack/highlight/languages/plaintext';
import { createTanStackMarkdownHighlighter } from '@tanstack/highlight/markdown';

const highlightCode = createTanStackMarkdownHighlighter(
  createHighlighter({ languages: [plaintext, js], fallbackLanguage: 'plaintext' }),
);

export const MdViewerLite: FC<{ document?: MarkdownDocument }> = ({ document }) => {
  return (
    <div>
      <Markdown allowHtml={false} highlighter={highlightCode}>{document ?? ''}</Markdown>
    </div>
  );
};
