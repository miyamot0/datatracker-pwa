import DocumentationEntryPage from '@/components/pages/documentation/documentation-entry-page';
import { AllFrontMatter, AllKeywordsArray, DocumentationObjects } from '@/lib/docs';
import { FrontMatterUniversalType } from '@/types/mdx';
import { redirect, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/documentation/$slug')({
  beforeLoad({ params }) {
    const entry = DocumentationObjects.find((entry) => entry.matter.filename.replaceAll('.md', '') === params.slug);

    if (!entry) {
      throw redirect({
        to: '/documentation',
      });
    }

    return {
      entry: entry,
    };
  },
  loader: async ({ context }) => {
    const { entry } = context;

    const PreviousEntry = AllFrontMatter.find((e) => e.index === entry.matter.index - 1);
    const NextEntry = AllFrontMatter.find((e) => e.index === entry.matter.index + 1);

    return {
      FrontMatter: entry.matter as FrontMatterUniversalType,
      KeywordArray: AllKeywordsArray,
      PreviousEntry,
      NextEntry,
      Entry: entry,
      Settings: context.folderHandleContext.settings,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { KeywordArray, Settings, PreviousEntry, NextEntry, Entry } = Route.useLoaderData();

  return (
    <DocumentationEntryPage
      KeywordArray={KeywordArray}
      PreviousEntry={PreviousEntry}
      NextEntry={NextEntry}
      Entry={Entry}
      Settings={Settings}
    />
  );
}
