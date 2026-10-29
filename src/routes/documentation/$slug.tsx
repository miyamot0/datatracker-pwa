import DocumentationEntryPage from '@/components/pages/documentation/documentation-entry-page';
import { AllFrontMatter, AllKeywordsArray, findFrontMatter, loadEntry } from '@/lib/docs';
import { FrontMatterUniversalType } from '@/types/mdx';
import { redirect, createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/documentation/$slug')({
  beforeLoad({ params }) {
    if (!findFrontMatter(params.slug)) {
      throw redirect({
        to: '/documentation',
      });
    }
  },
  loader: async ({ context, params }) => {
    const entry = await loadEntry(params.slug);

    if (!entry) {
      throw redirect({
        to: '/documentation',
      });
    }

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
  component: DocumentationEntryPage,
});
