import { KeywordColors } from '@/types/colors';
import { FrontMatterUniversalType, ParsedFrontMatterType } from '@/types/mdx';
import { generateKeywordColors } from './colors';

/**
 * Generate an array of documentation objects by parsing the front matter and content of markdown files in the specified directory
 */
const all_md_files = import.meta.glob('/src/assets/content/*.md', { query: '?raw', eager: true, import: 'default' });

/**
 * Generate an array of documentation objects by parsing the front matter and content of markdown files in the specified directory
 *
 * @returns an array of documentation objects with parsed front matter and content
 */
export const DocumentationObjects: ParsedFrontMatterType[] = Object.entries(all_md_files).map(([key, value], index) => {
  const filename = key.split('/').pop();
  const content = (value as string).split('---');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matter = {} as any;
  const entries = content[1].split('\n').filter((str: string) => str.trim() !== '');

  entries.forEach((entry) => {
    const [key, value] = entry.split(':');
    matter[key.trim()] = value.trim().replaceAll("'", '');
  });

  matter.index = index;
  matter.filename = filename;

  return {
    matter,
    value: content[2],
  } satisfies ParsedFrontMatterType;
});

export const AllFrontMatter = DocumentationObjects.sort((a, b) => a.matter.index - b.matter.index).map(
  (entry) => entry.matter as FrontMatterUniversalType,
);

export const AllKeywordsArray: KeywordColors[] = generateKeywordColors(AllFrontMatter);
