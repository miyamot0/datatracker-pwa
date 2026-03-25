import PageWrapper from '@/components/elements/page-wrapper';
import DocumentationEntryPage from '@/components/pages/documentation/documentation-entry-page';
import { BuildDocumentationBreadcrumb } from '@/components/ui/breadcrumb-entries';
import { generateKeywordColors } from '@/lib/colors';
import { DocumentationObjects } from '@/lib/docs';
import createHref from '@/lib/links';
import { KeywordColors } from '@/types/colors';
import { FrontMatterUniversalType } from '@/types/mdx';
import { createFileRoute, redirect } from '@tanstack/react-router';

// TODO: try to make this more static/specific rather than loading ALL md in all potential paths
const embeddedMDFiles = import.meta.glob('/src/assets/content/*.md', {
  query: '?raw',
  eager: true, // Try for lazy
  import: 'default',
});

export const Route = createFileRoute('/documentation/$slug')({
  beforeLoad({ params }) {
    const entry = DocumentationObjects.find((entry) => entry.matter.filename.replaceAll('.md', '') === params.slug);

    if (!entry || !entry.matter) {
      throw redirect({
        href: createHref({ type: 'Documentation' }),
      });
    }

    return {
      entry: entry,
    };
  },
  loader: ({ context }) => {
    const { entry } = context;

    const FrontMatter = DocumentationObjects.sort((a, b) => a.matter.index - b.matter.index).map(
      (entry) => entry.matter as FrontMatterUniversalType,
    );
    const KeywordArray: KeywordColors[] = generateKeywordColors(FrontMatter);

    const PreviousEntry = DocumentationObjects.find((e) => e.matter.index === entry.matter.index - 1);
    const NextEntry = DocumentationObjects.find((e) => e.matter.index === entry.matter.index + 1);

    return {
      FrontMatter,
      KeywordArray,
      PreviousEntry,
      NextEntry,
      Entry: entry,
      Settings: context.folderHandleContext.settings,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { FrontMatter, KeywordArray, PreviousEntry, NextEntry, Entry, Settings } = Route.useLoaderData();

  return (
    <PageWrapper
      breadcrumbs={[BuildDocumentationBreadcrumb()]}
      label={Entry.matter.title}
      className="select-none"
      Settings={Settings}
    >
      <DocumentationEntryPage
        FrontMatter={FrontMatter}
        KeywordArray={KeywordArray}
        PreviousEntry={PreviousEntry}
        NextEntry={NextEntry}
        Entry={Entry}
      />
    </PageWrapper>
  );
}
