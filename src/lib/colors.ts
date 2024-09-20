import { KeywordColors } from '@/types/colors';
import { FrontMatterUniversalType } from '../types/mdx';

export const FIGURE_PATH_COLORS = ['#9061C2', '#4E9CB5', '#4BC599', '#F9A826', '#EB540A', '#C86F98', '#14B694'];

export const COLOR_LIST = [
  'bg-blue-500 hover:bg-blue-600',
  'bg-green-500 hover:bg-green-600',
  'bg-yellow-500 hover:bg-yellow-600',
  'bg-purple-500 hover:bg-purple-600',
  'bg-pink-500 hover:bg-pink-600',
  'bg-indigo-500 hover:bg-indigo-600',
  'bg-teal-500 hover:bg-teal-600',
  'bg-orange-500 hover:bg-orange-600',
  'bg-rose-500 hover:bg-rose-600',
  'bg-cyan-500 hover:bg-cyan-600',
  'bg-amber-500 hover:bg-amber-600',
];

/**
 * Generate a list of keyword colors for the front matter data
 *
 * @param front_matter_data non-unique keywords
 * @returns
 */
export function generateKeywordColors(front_matter_data: FrontMatterUniversalType[]): KeywordColors[] {
  const untrimmed_array = front_matter_data
    .flatMap((entry) => entry.keywords.split(','))
    .map((str) => str.trim())
    .filter((str) => str.trim().length > 0);

  const set_trick = new Set(untrimmed_array);
  const trimmed_array = Array.from(set_trick);

  return trimmed_array.map((str, index) => {
    return {
      Keyword: str,
      Color: COLOR_LIST[index % COLOR_LIST.length],
    } satisfies KeywordColors;
  });
}
