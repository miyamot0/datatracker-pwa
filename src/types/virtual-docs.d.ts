declare module 'virtual:docs' {
  import type { FrontMatterUniversalType } from '@/types/mdx';
  import type { KeywordColors } from '@/types/colors';

  export const AllFrontMatter: FrontMatterUniversalType[];
  export const AllKeywordsArray: KeywordColors[];
  export const loadBody: Record<string, () => Promise<{ default: string }>>;
}

declare module 'virtual:docs-highlight.css';
