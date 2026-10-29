import type { FC } from 'react';

/**
 * Displays documentation HTML that was rendered from markdown at build time
 */
export const MdViewerLite: FC<{ html?: string }> = ({ html = '' }) => {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
};
