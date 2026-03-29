import { AllFrontMatter, AllKeywordsArray, DocumentationObjects } from '@/lib/docs';
import { FrontMatterUniversalType, ParsedFrontMatterType } from '@/types/mdx';
import { redirect, createFileRoute, lazyRouteComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/documentation/$slug')({
  beforeLoad({ params }) {
    const entry = DocumentationObjects.find((entry) => entry.filename.replaceAll('.md', '') === params.slug);

    if (!entry) {
      throw redirect({
        to: '/documentation',
      });
    }

    return {
      entry: entry,
    };
  },
  loader: async ({ context, params }) => {
    const filename = `${params.slug}.md`;

    const response = await fetch(`/content/${filename}`);

    if (!response.ok) {
      throw new Error(`Failed to load documentation content for slug: ${params.slug}`);
    }

    const body = await response.text();
    const content = (body as string).split('---');

    const preMatter = {
      filename,
      slug: params.slug,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    const entries = content[1].split('\n').filter((str: string) => str.trim() !== '');

    entries.forEach((entry) => {
      const [keyString, value] = entry.split(':');
      const key = keyString.trim();
      preMatter[key] = value.trim().replaceAll("'", '');
    });

    const matter = { ...preMatter, index: parseInt(preMatter.index) } as FrontMatterUniversalType;

    const result = {
      matter,
      value: content[2],
    } satisfies ParsedFrontMatterType;

    const PreviousEntry = AllFrontMatter.find((e) => e.index === result.matter.index - 1);
    const NextEntry = AllFrontMatter.find((e) => e.index === result.matter.index + 1);

    return {
      FrontMatter: result.matter as FrontMatterUniversalType,
      KeywordArray: AllKeywordsArray,
      PreviousEntry,
      NextEntry,
      Entry: result,
      Settings: context.folderHandleContext.settings,
    };
  },
  component: lazyRouteComponent(() => import('@/components/pages/documentation/documentation-entry-page')),
});
