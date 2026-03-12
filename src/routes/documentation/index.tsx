import { generateKeywordColors } from '@/lib/colors';
import { DocumentationObjects } from '@/lib/docs';
import { KeywordColors } from '@/types/colors';
import { FrontMatterUniversalType } from '@/types/mdx';
import { createFileRoute } from '@tanstack/react-router';
import DocumentationListingPage from './(components)/viewer-documentation-list/documentation-listing-page';

export const Route = createFileRoute('/documentation/')({
  loader: () => {
    const FrontMatter = DocumentationObjects.sort((a, b) => a.matter.index - b.matter.index).map(
      (entry) => entry.matter as FrontMatterUniversalType,
    );

    const KeywordArray: KeywordColors[] = generateKeywordColors(FrontMatter);

    return {
      FrontMatter,
      KeywordArray,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { FrontMatter, KeywordArray } = Route.useLoaderData();

  return <DocumentationListingPage FrontMatter={FrontMatter} KeywordArray={KeywordArray} />;
}
