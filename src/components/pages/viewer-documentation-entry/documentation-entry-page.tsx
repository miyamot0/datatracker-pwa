import { FrontMatterUniversalType } from '@/types/mdx';
import PageWrapper from '@/components/layout/page-wrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BuildDocumentationBreadcrumb } from '@/components/ui/breadcrumb-entries';
import { Badge } from '@/components/ui/badge';
import { KeywordColors } from '@/types/colors';
import { cn } from '@/lib/utils';
import { generateKeywordColors } from '@/lib/colors';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MdViewer } from '@/helpers/md-viewer';
import { DocumentationObjects } from '@/lib/docs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function DocumentationEntryPage() {
  const { slug } = useParams();

  const entry = DocumentationObjects.find((entry) => entry.matter.filename.replaceAll('.md', '') === slug);

  if (!entry || !entry.matter) throw new Error('Entry not found');

  const FrontMatter = DocumentationObjects.map((entry) => entry.matter as FrontMatterUniversalType);
  const KeywordArray: KeywordColors[] = generateKeywordColors(FrontMatter);

  const prev_entry = DocumentationObjects.find((e) => e.matter.index === entry.matter.index - 1);
  const next_entry = DocumentationObjects.find((e) => e.matter.index === entry.matter.index + 1);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <PageWrapper breadcrumbs={[BuildDocumentationBreadcrumb()]} label={entry.matter.title} className="select-none">
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-col md:flex-row md:justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>{entry.matter.title}</CardTitle>
            <CardDescription>
              Written {entry.matter.date} by {entry.matter.author}
            </CardDescription>
          </div>
          <div className="flex flex-row gap-2 items-start">
            {entry.matter.keywords.split(',').map((kw: string, index: number) => {
              const keyword_obj = KeywordArray.find((obj) => obj.Keyword === kw.trim());
              const color_str = keyword_obj ? keyword_obj.Color : 'bg-gray-500';

              return (
                <Badge key={index} className={cn(color_str, 'select-none text-white whitespace-nowrap')}>
                  {kw}
                </Badge>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="prose dark:prose-invert !max-w-none">
          <MdViewer source={entry.value} />
        </CardContent>
        <CardFooter className="flex flex-row justify-between">
          <Link
            unstable_viewTransition
            to={`/documentation/${prev_entry?.matter.filename.replaceAll('.md', '')}`}
            onClick={scrollToTop}
            className={cn('flex flex-row', {
              'pointer-events-none disabled': !prev_entry,
            })}
          >
            <Button disabled={!prev_entry} variant={'outline'} className="w-full shadow-xl">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Read Previous
            </Button>
          </Link>

          <Link
            unstable_viewTransition
            to={`/documentation/${next_entry?.matter.filename.replaceAll('.md', '')}`}
            onClick={scrollToTop}
            className={cn('flex flex-row', {
              'pointer-events-none disabled': !next_entry,
            })}
          >
            <Button disabled={!next_entry} variant={'outline'} className="w-full shadow-xl">
              Read Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </PageWrapper>
  );
}
