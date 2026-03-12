/**
 * This is the type for all frontmatter in MDs
 */
export type FrontMatterUniversalType = {
  title: string;
  filename: string;
  date: string;
  keywords: string;
  author: string;
  description: string;
  index: number;
};

/**
 * This is the type for the parsed frontmatter and content of an MD file
 */
export type ParsedFrontMatterType = {
  matter: FrontMatterUniversalType;
  value: string;
};
