import { FrontMatterUniversalType } from '@/types/mdx';
import PageWrapper from '@/components/layout/page-wrapper';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { BuildDocumentationBreadcrumb } from '@/components/ui/breadcrumb-entries';
import { Badge } from '@/components/ui/badge';
import { KeywordColors } from '@/types/colors';
import { cn } from '@/lib/utils';

import documentation from '@/assets/documentation.json';
import { generateKeywordColors } from '@/lib/colors';
import { Link, useParams } from 'react-router-dom';

import { useEffect, useState } from 'react';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

import type { FC, ReactNode } from 'react';
import type { MDXProps } from 'mdx/types';
import type { EvaluateOptions } from '@mdx-js/mdx';
import { evaluate } from '@mdx-js/mdx';
import { Button } from '@/components/ui/button';

type ReactMDXContent = (props: MDXProps) => ReactNode;
type Runtime = Pick<EvaluateOptions, 'jsx' | 'jsxs' | 'Fragment'>;

const runtime = { jsx, jsxs, Fragment } as Runtime;

const Preview: FC<{ source?: string }> = ({ source = '' }) => {
  const [MdxContent, setMdxContent] = useState<ReactMDXContent>(() => () => null);

  useEffect(() => {
    evaluate(source, runtime).then((r) => setMdxContent(() => r.default));
  }, [source]);

  return <MdxContent />;
};

export default function DocumentationEntryPage() {
  const { slug } = useParams();

  const entries = documentation.information.sort((a, b) => a.matter.index - b.matter.index);

  console.log(entries);

  const entry = entries.find((entry) => entry.matter.filename.replaceAll('.md', '') === slug);

  if (!entry || !entry.matter) throw new Error('Entry not found');

  const FrontMatter = entries.map((entry) => entry.matter as FrontMatterUniversalType);
  const KeywordArray: KeywordColors[] = generateKeywordColors(FrontMatter);

  const prev_entry = entries.find((e) => e.matter.index === entry.matter.index - 1);
  const next_entry = entries.find((e) => e.matter.index === entry.matter.index + 1);

  return (
    <PageWrapper breadcrumbs={[BuildDocumentationBreadcrumb()]} label={entry.matter.title}>
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-col md:flex-row md:justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>{entry.matter.title}</CardTitle>
            <CardDescription>
              Written {entry.matter.date} by {entry.matter.author}
            </CardDescription>
          </div>
          <div className="flex flex-row gap-1 items-start">
            {entry.matter.keywords.split(',').map((kw, index) => {
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
          <Preview source={entry.value} />
        </CardContent>
        <CardFooter className="flex flex-row justify-between">
          <Link
            unstable_viewTransition
            to={`/documentation/${prev_entry?.matter.filename.replaceAll('.md', '')}`}
            className={cn('flex flex-row', {
              'pointer-events-none disabled': !prev_entry,
            })}
          >
            <Button disabled={!prev_entry} variant={'outline'} className="w-full shadow-xl">
              Read Previous
            </Button>
          </Link>

          <Link
            unstable_viewTransition
            to={`/documentation/${next_entry?.matter.filename.replaceAll('.md', '')}`}
            className={cn('flex flex-row', {
              'pointer-events-none disabled': !next_entry,
            })}
          >
            <Button disabled={!next_entry} variant={'outline'} className="w-full shadow-xl">
              Read Next
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </PageWrapper>
  );
}
