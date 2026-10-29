import { AllFrontMatter, AllKeywordsArray, loadBody } from 'virtual:docs';
import { ParsedFrontMatterType } from '@/types/mdx';

export { AllFrontMatter, AllKeywordsArray };

/**
 * Looks up the front matter for a documentation entry by its slug (filename without `.md`)
 */
export const findFrontMatter = (slug: string) => AllFrontMatter.find((matter) => matter.slug === slug);

/**
 * Loads a documentation entry with its pre-rendered HTML body (built at compile time by the prerender-docs plugin)
 *
 * @returns the entry, or undefined if no entry exists for the slug
 */
export async function loadEntry(slug: string): Promise<ParsedFrontMatterType | undefined> {
  const matter = findFrontMatter(slug);
  const load = loadBody[slug];
  if (!matter || !load) return undefined;

  const { default: value } = await load();
  return { matter, value };
}
