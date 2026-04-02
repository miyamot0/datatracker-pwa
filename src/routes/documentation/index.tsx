import { AllFrontMatter, AllKeywordsArray } from '@/lib/docs';
import { createFileRoute } from '@tanstack/react-router';
import DocumentationListingPage from '../../components/pages/documentation/documentation-listing-page';

export const Route = createFileRoute('/documentation/')({
  loader: ({ context }) => {
    return {
      FrontMatter: AllFrontMatter,
      KeywordArray: AllKeywordsArray,
      Settings: context.folderHandleContext.settings,
    };
  },
  component: DocumentationListingPage,
});
