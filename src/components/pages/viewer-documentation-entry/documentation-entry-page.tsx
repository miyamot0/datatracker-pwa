"use server";

import { FrontMatterUniversalType } from "@/lib/mdx";
import PageWrapper from "@/components/layout/page-wrapper";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BuildDocumentationBreadcrumb } from "@/components/ui/breadcrumb-entries";
import { Badge } from "@/components/ui/badge";
import { JSXElementConstructor, ReactElement } from "react";
import { KeywordColors } from "@/types/colors";
import { cn } from "@/lib/utils";

type Props = {
  Keywords: string[];
  Content: ReactElement<any, string | JSXElementConstructor<any>>;
  FrontMatter: FrontMatterUniversalType;
  KeywordArray: KeywordColors[];
};

export default async function DocumentationEntryPage({
  Keywords,
  Content,
  FrontMatter,
  KeywordArray,
}: Props) {
  return (
    <PageWrapper
      breadcrumbs={[BuildDocumentationBreadcrumb()]}
      label={FrontMatter.title}
    >
      <Card className="w-full max-w-screen-2xl">
        <CardHeader className="flex flex-row justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>{FrontMatter.title}</CardTitle>
            <CardDescription>{FrontMatter.title}</CardDescription>
          </div>
          <div className="flex flex-row gap-1 items-start">
            {Keywords.map((kw, index) => {
              const keyword_obj = KeywordArray.find(
                (obj) => obj.Keyword === kw.trim()
              );
              const color_str = keyword_obj ? keyword_obj.Color : "bg-gray-500";

              return (
                <Badge key={index} className={cn(color_str, "select-none")}>
                  {kw}
                </Badge>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="prose dark:prose-invert !max-w-none">
          {Content}
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
