import { generateKeywordColors } from '@/lib/colors';
import { DocumentationObjects } from '@/lib/docs';
import { KeywordColors } from '@/types/colors';
import { FrontMatterUniversalType } from '@/types/mdx';
import { createFileRoute } from '@tanstack/react-router';
import DocumentationListingPage from '../../components/pages/documentation/documentation-listing-page';
import PageWrapper from '@/components/elements/page-wrapper';

export const Route = createFileRoute('/documentation/')({
  loader: ({ context }) => {
    const FrontMatter = DocumentationObjects.sort((a, b) => a.matter.index - b.matter.index).map(
      (entry) => entry.matter as FrontMatterUniversalType,
    );

    const KeywordArray: KeywordColors[] = generateKeywordColors(FrontMatter);

    return {
      FrontMatter,
      KeywordArray,
      Settings: context.folderHandleContext.settings,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { FrontMatter, KeywordArray, Settings } = Route.useLoaderData();

  return (
    <PageWrapper label={'Documentation'} className="select-none" Settings={Settings}>
      <DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={KeywordArray} />
    </PageWrapper>
  );
}
