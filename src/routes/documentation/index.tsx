import { AllFrontMatter, AllKeywordsArray } from '@/lib/docs';
import { createFileRoute } from '@tanstack/react-router';
import DocumentationListingPage from '../../components/pages/documentation/documentation-listing-page';
import PageWrapper from '@/components/elements/page-wrapper';

export const Route = createFileRoute('/documentation/')({
  loader: ({ context }) => {
    return {
      FrontMatter: AllFrontMatter,
      KeywordArray: AllKeywordsArray,
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
