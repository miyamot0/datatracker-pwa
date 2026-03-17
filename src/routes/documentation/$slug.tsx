import DocumentationEntryPage from '@/components/pages/documentation/documentation-entry-page';
import { generateKeywordColors } from '@/lib/colors';
import { DocumentationObjects } from '@/lib/docs';
import createHref from '@/lib/links';
import { KeywordColors } from '@/types/colors';
import { FrontMatterUniversalType } from '@/types/mdx';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/documentation/$slug')({
  loader: ({ params }) => {
    const { slug } = params;

    const Entry = DocumentationObjects.find((entry) => entry.matter.filename.replaceAll('.md', '') === slug);

    if (!Entry || !Entry.matter) {
      throw redirect({
        href: createHref({ type: 'Documentation' }),
      });
    }

    const FrontMatter = DocumentationObjects.sort((a, b) => a.matter.index - b.matter.index).map(
      (entry) => entry.matter as FrontMatterUniversalType,
    );
    const KeywordArray: KeywordColors[] = generateKeywordColors(FrontMatter);

    const PreviousEntry = DocumentationObjects.find((e) => e.matter.index === Entry.matter.index - 1);
    const NextEntry = DocumentationObjects.find((e) => e.matter.index === Entry.matter.index + 1);

    return {
      FrontMatter,
      KeywordArray,
      PreviousEntry,
      NextEntry,
      Entry,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { FrontMatter, KeywordArray, PreviousEntry, NextEntry, Entry } = Route.useLoaderData();

  return (
    <DocumentationEntryPage
      FrontMatter={FrontMatter}
      KeywordArray={KeywordArray}
      PreviousEntry={PreviousEntry}
      NextEntry={NextEntry}
      Entry={Entry}
    />
  );
}
