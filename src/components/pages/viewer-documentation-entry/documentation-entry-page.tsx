/* eslint-disable @typescript-eslint/no-explicit-any */
import { FrontMatterUniversalType } from '@/types/mdx';
import PageWrapper from '@/components/layout/page-wrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BuildDocumentationBreadcrumb } from '@/components/ui/breadcrumb-entries';
import { Badge } from '@/components/ui/badge';
import { KeywordColors } from '@/types/colors';
import { cn } from '@/lib/utils';
import { generateKeywordColors } from '@/lib/colors';
import { Link, redirect, useLoaderData } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MdViewer } from '@/helpers/md-viewer';
import { DocumentationObjects } from '@/lib/docs';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import createHref from '@/lib/links';
import { FolderHandleContextType } from '@/context/folder-context';

type LoaderResult = {
  FrontMatter: FrontMatterUniversalType[];
  KeywordArray: KeywordColors[];
  Context: FolderHandleContextType;
  PreviousEntry:
    | {
        matter: any;
        value: string;
      }
    | undefined;
  NextEntry:
    | {
        matter: any;
        value: string;
      }
    | undefined;
  Entry: {
    matter: any;
    value: string;
  };
};

// eslint-disable-next-line react-refresh/only-export-components
export const documentationEntryPageLoader = (ctx: FolderHandleContextType) => {
  return async ({ params }: any) => {
    const { slug } = params;

    const Entry = DocumentationObjects.find((entry) => entry.matter.filename.replaceAll('.md', '') === slug);

    if (!Entry || !Entry.matter) {
      const response = redirect(createHref({ type: 'Documentation' }));
      throw response;
    }

    const FrontMatter = DocumentationObjects.sort((a, b) => a.matter.index - b.matter.index).map(
      (entry) => entry.matter as FrontMatterUniversalType
    );
    const KeywordArray: KeywordColors[] = generateKeywordColors(FrontMatter);

    const PreviousEntry = DocumentationObjects.find((e) => e.matter.index === Entry.matter.index - 1);
    const NextEntry = DocumentationObjects.find((e) => e.matter.index === Entry.matter.index + 1);

    return {
      FrontMatter,
      KeywordArray,
      Context: ctx,
      PreviousEntry,
      NextEntry,
      Entry,
    } satisfies LoaderResult;
  };
};

export default function DocumentationEntryPage() {
  const loaderResult = useLoaderData() as LoaderResult;
  const { KeywordArray, PreviousEntry, NextEntry, Entry } = loaderResult;

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <PageWrapper breadcrumbs={[BuildDocumentationBreadcrumb()]} label={Entry.matter.title} className="select-none">
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-col md:flex-row md:justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>{Entry.matter.title}</CardTitle>
            <CardDescription>
              Written {Entry.matter.date} by {Entry.matter.author}
            </CardDescription>
            <div className="flex flex-row gap-2 items-start pt-1">
              <span>Tags: </span>
              {Entry.matter.keywords.split(',').map((kw: string, index: number) => {
                const keyword_obj = KeywordArray.find((obj) => obj.Keyword === kw.trim());
                const color_str = keyword_obj ? keyword_obj.Color : 'bg-gray-500';

                return (
                  <Badge key={index} className={cn(color_str, 'select-none text-white whitespace-nowrap')}>
                    {kw}
                  </Badge>
                );
              })}
            </div>
          </div>
          <BackButton Label="Back to Documentation List" Href={createHref({ type: 'Documentation' })} />
        </CardHeader>
        <CardContent className="prose dark:prose-invert !max-w-none">
          <MdViewer source={Entry.value} />
        </CardContent>
        <CardFooter className="flex flex-row justify-between">
          <Link
            unstable_viewTransition
            to={`/documentation/${PreviousEntry?.matter.filename.replaceAll('.md', '')}`}
            onClick={scrollToTop}
            className={cn('flex flex-row', {
              'pointer-events-none disabled': !PreviousEntry,
            })}
          >
            <Button disabled={!PreviousEntry} className="w-full shadow-xl">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Read Previous
            </Button>
          </Link>

          <Link
            unstable_viewTransition
            to={`/documentation/${NextEntry?.matter.filename.replaceAll('.md', '')}`}
            onClick={scrollToTop}
            className={cn('flex flex-row', {
              'pointer-events-none disabled': !NextEntry,
            })}
          >
            <Button disabled={!NextEntry} className="w-full shadow-xl">
              Read Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </PageWrapper>
  );
}
