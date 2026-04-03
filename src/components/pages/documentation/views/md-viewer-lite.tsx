import type { FC } from 'react';
import rehypeHighlight from 'rehype-highlight';
import Markdown, { Components } from 'react-markdown';

const CustomComponents = {
  img: ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    node,
    ...props
  }: {
    node: Components;
    props: {
      alt?: string; // The alt text for the image
      src: string; // The source URL for the image
      title?: string; // The title text for the image (optional)
    };
    // eslint-disable-next-line jsx-a11y/alt-text
  }) => <img {...props} style={{ display: 'block', margin: '0 auto', maxWidth: '100%' }} />,
};

export const MdViewerLite: FC<{ source?: string }> = ({ source = '' }) => {
  return (
    // @ts-expect-error - type nonsense
    <Markdown components={CustomComponents} rehypePlugins={[rehypeHighlight]}>
      {source}
    </Markdown>
  );
};
