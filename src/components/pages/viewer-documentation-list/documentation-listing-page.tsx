import PageWrapper from '@/components/layout/page-wrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { generateKeywordColors } from '@/lib/colors';
import { FrontMatterUniversalType } from '@/types/mdx';
import { cn } from '@/lib/utils';
import { KeywordColors } from '@/types/colors';
import { BookIcon, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DocumentationObjects } from '@/lib/docs';
import BackButton from '@/components/ui/back-button';
import createHref from '@/lib/links';

export default function DocumentationListingPage() {
  const FrontMatter = DocumentationObjects.sort((a, b) => a.matter.index - b.matter.index).map(
    (entry) => entry.matter as FrontMatterUniversalType
  );

  const KeywordArray: KeywordColors[] = generateKeywordColors(FrontMatter);

  return (
    <PageWrapper label={'Documentation'} className="select-none">
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5 grow">
            <CardTitle>Program Documentation</CardTitle>
            <CardDescription>Guidelines and Instructions for using DataTracker</CardDescription>
          </div>
          <BackButton Label="Back to Home" Href={createHref({ type: 'Home' })} />
        </CardHeader>

        <CardContent className="flex flex-col divide-y divide-solid dark:divide-white">
          {FrontMatter.map((entry, index) => {
            const kw_badges = entry.keywords
              .split(',')
              .map((str) => str.trim())
              .filter((str) => str !== '');

            return (
              <div key={index} className="flex flex-col md:flex-row md:justify-between md:items-center py-5 gap-2">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-row gap-1 flex-1 items-end font-semibold">
                    <span>{`${entry.index + 1}. ${entry.title}`}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{entry.description}</span>
                  <span className="text-sm text-muted-foreground">
                    Written {entry.date} by {entry.author}
                  </span>
                  <div className="flex flex-row gap-2 text-sm mt-1 flex-wrap">
                    <span className="font-semibold">Keywords: </span>
                    {kw_badges.map((kw, index) => {
                      const keyword_obj = KeywordArray.find((obj) => obj.Keyword === kw);
                      const color_str = keyword_obj ? keyword_obj.Color : 'bg-gray-500';

                      return (
                        <Badge key={index} className={cn(color_str, 'select-none text-white whitespace-nowrap')}>
                          {kw}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <Link
                  unstable_viewTransition
                  to={`/documentation/${entry.filename.replaceAll('.md', '')}`}
                  className="w-full md:w-fit"
                >
                  <Button variant={'outline'} className="shadow w-full md:w-fit " size={'sm'}>
                    <BookIcon className="w-4 h-4 mr-2" />
                    Read More
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
