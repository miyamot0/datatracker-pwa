import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import BackButton from '@/components/ui/back-button';
import { Link } from '@tanstack/react-router';
import { MdViewerLite } from './views/md-viewer-lite';
import { TRANSITION_CLASSES } from '@/types/transitions';
import PageWrapper from '@/components/elements/page-wrapper';
import { BuildDocumentationBreadcrumb } from '@/components/ui/breadcrumb-entries';
import { FrontMatterUniversalType, ParsedFrontMatterType } from '@/types/mdx';
import { ApplicationSettingsTypes } from '@/types/settings/application-settings';
import { KeywordColors } from '@/types/colors';

type Props = {
  KeywordArray: KeywordColors[];
  PreviousEntry: FrontMatterUniversalType | undefined;
  NextEntry: FrontMatterUniversalType | undefined;
  Entry: ParsedFrontMatterType;
  Settings: ApplicationSettingsTypes;
};

export default function DocumentationEntryPage({ KeywordArray, PreviousEntry, NextEntry, Entry, Settings }: Props) {
  const animTypes = TRANSITION_CLASSES[Settings.TransitionBehavior];

  const animLeft = animTypes.length > 0 ? [animTypes[animTypes.length - 1]] : [];
  const animRight = animTypes.length > 0 ? [animTypes[0]] : [];

  return (
    <PageWrapper
      breadcrumbs={[BuildDocumentationBreadcrumb()]}
      label={Entry.matter.title}
      className="select-none"
      Settings={Settings}
    >
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
          <BackButton />
        </CardHeader>
        <CardContent className="prose dark:prose-invert !max-w-none">
          <MdViewerLite source={Entry.value} />
        </CardContent>
        <CardFooter className="flex flex-row justify-between">
          <Link
            to={`/documentation/$slug`}
            params={{ slug: PreviousEntry?.filename.replaceAll('.md', '') ?? '/documentation' }}
            className={cn('flex flex-row', {
              'pointer-events-none disabled': !PreviousEntry,
            })}
            viewTransition={{ types: animLeft }}
          >
            <Button disabled={!PreviousEntry} className="w-full shadow-xl">
              <ChevronLeft className="w-4 h-4 mr-2" />
              Read Previous
            </Button>
          </Link>

          <Link
            to={`/documentation/$slug`}
            params={{ slug: NextEntry?.filename.replaceAll('.md', '') ?? '/documentation' }}
            className={cn('flex flex-row', {
              'pointer-events-none disabled': !NextEntry,
            })}
            viewTransition={{ types: animRight }}
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
