import { PluginOption } from 'vite';

const SCRUB_PATTERNS = [
  /<script\s+src="\.?\/?trusted-types-init\.js"><\/script>/,
];

/**
 * Removes scripts from the island HTML that are not needed and may cause CSP issues.
 */
export const scrubIslandHtmlPlugin: PluginOption = {
  name: 'scrub-island-html',
  transformIndexHtml(html: string): string {
    let result = html;
    for (const pattern of SCRUB_PATTERNS) {
      result = result.replace(pattern, '');
    }
    return result;
  },
};
