import { PluginOption } from 'vite';

const SCRUB_PATTERNS = [
  /<script\s+src="\.?\/?trusted-types-init\.js"><\/script>/,
  /<script\s+async\s+src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[^"]*"><\/script>/,
  /<script\s+src="\.?\/?analytics-init\.js"><\/script>/,
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
